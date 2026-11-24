/**
 * Sign-in for the CMAS add-in for Excel (VBA), by device code.
 *
 *   1. The add-in calls start(): it gets a deviceCode (its secret, 43 chars)
 *      and a userCode (8 chars, shown to the instructor).
 *   2. The instructor opens /excel/link in the web app, where they are already
 *      signed in, types the userCode and picks ONE course. The page posts to
 *      /courses/:courseId/excel-links, whose access hook checks score.edit on
 *      that course before approve() runs.
 *   3. The add-in polls collect() with its deviceCode. After approval it gets
 *      a token, once. The token reads that course and writes its scores, for
 *      8 hours, and nothing else (access.middleware.ts: excelTokenAllows).
 *
 * Why not a password or a copied API key: nothing secret is ever typed or
 * pasted, so nothing secret can end up in a cell, an email or a screenshot.
 * The userCode alone is useless: only the add-in holding the matching
 * deviceCode can collect the token.
 */
import { createHash, randomBytes, randomInt } from "node:crypto"
import { readFile } from "node:fs/promises"
import { Prisma } from "@prisma/client"
import { env } from "../../lib/env.js"
import { NotFoundError } from "../../lib/errors.js"
import { ADDIN_FILE, ADDIN_RELEASE, WORKBOOK_RELEASE, WORKBOOK_TEMPLATE } from "./addin-release.js"
import { CourseRevisionRepository } from "../../repositories/course-revision.repository.js"
import { stampWorkbook } from "./workbook-stamp.js"
import type { ExcelDeviceCodeRepository } from "./excel-device-code.repository.js"
import type { ExcelLinkRepository } from "./excel-link.repository.js"
import { USER_CODE_ALPHABET, USER_CODE_LENGTH } from "./excel.validator.js"

export const DEVICE_CODE_TTL_MS = 10 * 60_000
/** The add-in waits this long between polls. */
export const POLL_INTERVAL_S = 5
export const LINK_TTL_MS = 8 * 60 * 60_000
/** Tells an add-in token apart from a JWT before any parsing. */
export const EXCEL_TOKEN_PREFIX = "cmasx_"
const CREATE_ATTEMPTS = 3

type Codes = Pick<
  ExcelDeviceCodeRepository,
  "sweepExpired" | "create" | "approve" | "findByDeviceCode" | "consumeAndLink"
>
type Links = Pick<ExcelLinkRepository, "listLive" | "revoke">

export type StartResult = {
  deviceCode: string
  /** Shown as ABCD-2345; the dash is for reading only. */
  userCode: string
  verifyUrl: string
  expiresIn: number
  interval: number
}

export type CollectResult =
  | { status: "pending"; interval: number }
  // Unknown, expired or already collected. One answer for all three.
  | { status: "expired" }
  | {
      status: "ok"
      token: string
      expiresAt: Date
      course: {
        id: string
        code: string
        name: string
        section: string
        semester: number
        year: number
      }
    }

export const newUserCode = (pick: (max: number) => number = randomInt) =>
  Array.from(
    { length: USER_CODE_LENGTH },
    () => USER_CODE_ALPHABET[pick(USER_CODE_ALPHABET.length)],
  ).join("")

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"

export class ExcelService {
  constructor(
    private readonly codes: Codes,
    private readonly links: Links,
    private readonly appUrl: string = env.CORS_ORIGIN,
    private readonly revisions: Pick<
      CourseRevisionRepository,
      "read" | "label"
    > = new CourseRevisionRepository(),
  ) {}

  async start(): Promise<StartResult> {
    const { deviceCode, userCode } = await this.newCode()
    return {
      deviceCode,
      userCode: `${userCode.slice(0, 4)}-${userCode.slice(4)}`,
      verifyUrl: `${this.appUrl}/excel/link`,
      expiresIn: DEVICE_CODE_TTL_MS / 1000,
      interval: POLL_INTERVAL_S,
    }
  }

  private async newCode(): Promise<{ deviceCode: string; userCode: string }> {
    await this.codes.sweepExpired()
    const deviceCode = randomBytes(32).toString("base64url")
    const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_MS)

    // 32^8 codes: a clash with a live one is rare, and the unique index catches it.
    for (let attempt = 1; ; attempt++) {
      const userCode = newUserCode()
      try {
        await this.codes.create(deviceCode, userCode, expiresAt)
        return { deviceCode, userCode }
      } catch (err) {
        if (!isUniqueViolation(err) || attempt >= CREATE_ATTEMPTS) throw err
      }
    }
  }

  /**
   * The score workbook for one course, ready to open. Its one-time ticket is a
   * device code approved here for the caller and this course, so the file's
   * VBA collects a token with it through /excel/token like any device code:
   * single use, dead after DEVICE_CODE_TTL_MS. A file opened later, or a second
   * time, signs in with an ordinary device code instead.
   *
   * `courseId` is the one the access hook authorized for score.edit. `apiOrigin` is
   * where the file reaches this server, which is not the web app's address.
   */
  async workbook(
    userId: string,
    courseId: string,
    apiOrigin: string,
    template: URL = WORKBOOK_TEMPLATE,
    expected = WORKBOOK_RELEASE.sha256,
  ): Promise<{ bytes: Buffer; fileName: string }> {
    const missing = new NotFoundError("ยังไม่เปิดให้ดาวน์โหลดไฟล์กรอกคะแนน")
    const bytes = await verifiedFile(template, expected, missing)
    const course = await this.revisions.label(courseId)
    if (!course) throw new NotFoundError()

    const { deviceCode, userCode } = await this.newCode()
    if (!(await this.codes.approve(userCode, userId, courseId))) throw missing

    const label = `${course.code} ${course.name} Sec ${course.section}`
    return {
      bytes: stampWorkbook(bytes, {
        CmasApi: apiOrigin,
        CmasCourseId: courseId,
        CmasCourseLabel: label,
        CmasTicket: deviceCode,
      }),
      fileName: `CMAS ${course.code} Sec ${course.section} ${course.semester}-${course.year}.xlsm`,
    }
  }

  /**
   * `courseId` is the one the access hook authorized for score.edit (404 for a
   * course the caller cannot see, 403 for ADMIN). `userCode` is already
   * normalised by approveSchema.
   */
  async approve(userId: string, userCode: string, courseId: string): Promise<void> {
    const approved = await this.codes.approve(userCode, userId, courseId)
    if (!approved)
      throw new NotFoundError("รหัสไม่ถูกต้องหรือหมดอายุ — กดเชื่อมต่อใน Excel เพื่อขอรหัสใหม่")
  }

  async collect(deviceCode: string, now = new Date()): Promise<CollectResult> {
    const code = await this.codes.findByDeviceCode(deviceCode)
    if (!code || code.consumedAt || code.expiresAt <= now) return { status: "expired" }
    if (!code.approvedAt || !code.userId || !code.courseId)
      return { status: "pending", interval: POLL_INTERVAL_S }

    const token = EXCEL_TOKEN_PREFIX + randomBytes(32).toString("base64url")
    const link = await this.codes.consumeAndLink(code.id, {
      userId: code.userId,
      courseId: code.courseId,
      token,
      expiresAt: new Date(now.getTime() + LINK_TTL_MS),
    })
    // Lost the race to another poll with the same deviceCode.
    if (!link) return { status: "expired" }
    return { status: "ok", token, expiresAt: link.expiresAt, course: link.course }
  }

  /** FR-76: the number the add-in polls. The access hook already found the course, so it exists. */
  async revision(courseId: string): Promise<{ revision: number }> {
    const revision = await this.revisions.read(courseId)
    if (revision === null) throw new NotFoundError()
    return { revision }
  }

  listLinks(userId: string) {
    return this.links.listLive(userId)
  }

  async revoke(userId: string, linkId: string): Promise<void> {
    if (!(await this.links.revoke(userId, linkId))) throw new NotFoundError()
  }

  /**
   * The released CMAS.xlam. Served only when the release names a SHA-256 AND the file
   * on disk still hashes to it: a swapped or half-written file is refused, so the hash
   * the page shows is always the hash of what was downloaded.
   */
  addinFile(source: URL = ADDIN_FILE, expected = ADDIN_RELEASE.sha256): Promise<Buffer> {
    return verifiedFile(source, expected, new NotFoundError("ยังไม่เปิดให้ดาวน์โหลด add-in"))
  }
}

/** The file's bytes, only when a SHA-256 is published AND the file still hashes to it. */
async function verifiedFile(source: URL, expected: string | null, missing: Error): Promise<Buffer> {
  if (!expected) throw missing
  let bytes: Buffer
  try {
    bytes = await readFile(source)
  } catch {
    throw missing
  }
  if (createHash("sha256").update(bytes).digest("hex") !== expected) throw missing
  return bytes
}
