import { createHash } from "node:crypto"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { Prisma } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import { NotFoundError } from "../../lib/errors.js"
import {
  DEVICE_CODE_TTL_MS,
  EXCEL_TOKEN_PREFIX,
  ExcelService,
  LINK_TTL_MS,
  newUserCode,
} from "./excel.service.js"
import { USER_CODE_ALPHABET, approveSchema, collectTokenSchema } from "./excel.validator.js"
import { fakeXlsm } from "../../test/fake-xlsm.js"
import { apiOriginOf } from "./excel.controller.js"
import { readCustomProperties } from "./workbook-stamp.js"

const course = { id: "c1", code: "90641001", name: "วิชา", section: "01", semester: 1, year: 2569 }

function setup(code: unknown = null) {
  const codes = {
    sweepExpired: vi.fn(async () => {}),
    create: vi.fn(async (_d: string, _u: string, _e: Date) => {}),
    approve: vi.fn(async () => true),
    findByDeviceCode: vi.fn(async () => code as never),
    consumeAndLink: vi.fn(async (_id: string, link: { expiresAt: Date }) => ({
      id: "l1",
      expiresAt: link.expiresAt,
      course,
    })),
  }
  const links = { listLive: vi.fn(async () => []), revoke: vi.fn(async () => true) }
  const revisions = {
    read: vi.fn(async (): Promise<number | null> => 7),
    label: vi.fn(async () => course as typeof course | null),
  }
  const service = new ExcelService(codes, links, "https://cmas.test", revisions)
  return { service, codes, links, revisions }
}

const now = new Date("2026-11-19T10:00:00Z")
const live = {
  id: "d1",
  expiresAt: new Date(now.getTime() + 60_000),
  approvedAt: null as Date | null,
  consumedAt: null as Date | null,
  userId: null as string | null,
  courseId: null as string | null,
}
const approved = { ...live, approvedAt: now, userId: "u1", courseId: "c1" }

describe("start", () => {
  it("issues a 43-char deviceCode and an 8-char userCode shown with a dash", async () => {
    const { service, codes } = setup()
    const r = await service.start()
    expect(collectTokenSchema.safeParse({ deviceCode: r.deviceCode }).success).toBe(true)
    expect(r.userCode).toMatch(
      new RegExp(`^[${USER_CODE_ALPHABET}]{4}-[${USER_CODE_ALPHABET}]{4}$`),
    )
    expect(r.verifyUrl).toBe("https://cmas.test/excel/link")
    expect(r.expiresIn).toBe(DEVICE_CODE_TTL_MS / 1000)
    // Stored without the dash, so approveSchema's normalised input matches it.
    expect(codes.create.mock.calls[0]![1]).toBe(r.userCode.replace("-", ""))
    expect(codes.sweepExpired).toHaveBeenCalled()
  })

  it("retries a userCode clash, then gives up", async () => {
    const { service, codes } = setup()
    const clash = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "x",
    })
    codes.create.mockRejectedValueOnce(clash)
    await expect(service.start()).resolves.toBeDefined()
    expect(codes.create).toHaveBeenCalledTimes(2)

    codes.create.mockReset().mockRejectedValue(clash)
    await expect(service.start()).rejects.toBe(clash)
    expect(codes.create).toHaveBeenCalledTimes(3)
  })
})

describe("newUserCode", () => {
  it("draws only from the alphabet without 0/O/1/I", () => {
    expect(newUserCode(() => 0)).toBe("AAAAAAAA")
    expect(newUserCode((max) => max - 1)).toBe("99999999")
    expect(USER_CODE_ALPHABET).not.toMatch(/[01IO]/)
  })
})

describe("approve", () => {
  it("says the code is wrong or expired when nothing was approved", async () => {
    const { service, codes } = setup()
    codes.approve.mockResolvedValueOnce(false)
    await expect(service.approve("u1", "ABCD2345", "c1")).rejects.toBeInstanceOf(NotFoundError)
  })

  it("approves for the caller and the authorized course", async () => {
    const { service, codes } = setup()
    await service.approve("u1", "ABCD2345", "c1")
    expect(codes.approve).toHaveBeenCalledWith("ABCD2345", "u1", "c1")
  })

  it("accepts the code the way a person types it", () => {
    expect(approveSchema.parse({ userCode: " abcd-2345 " }).userCode).toBe("ABCD2345")
    expect(approveSchema.safeParse({ userCode: "ABCD-234O" }).success).toBe(false)
  })

  it("takes the course from the path only: a courseId in the body is refused (A-8)", () => {
    expect(
      approveSchema.safeParse({ userCode: "ABCD2345", courseId: "cjld2cjxh0000qzrmn831i7rn" })
        .success,
    ).toBe(false)
  })
})

describe("collect", () => {
  it("answers expired for unknown, expired and collected codes alike", async () => {
    for (const code of [null, { ...approved, expiresAt: now }, { ...approved, consumedAt: now }]) {
      const { service, codes } = setup(code as never)
      await expect(service.collect("d".repeat(43), now)).resolves.toEqual({ status: "expired" })
      expect(codes.consumeAndLink).not.toHaveBeenCalled()
    }
  })

  it("keeps the add-in waiting until the code is approved", async () => {
    const { service } = setup(live as never)
    await expect(service.collect("d".repeat(43), now)).resolves.toMatchObject({ status: "pending" })
  })

  it("hands out one 8-hour token for the approved course", async () => {
    const { service, codes } = setup(approved as never)
    const r = await service.collect("d".repeat(43), now)
    expect(r).toMatchObject({ status: "ok", course })
    if (r.status !== "ok") throw new Error("unreachable")
    expect(r.token.startsWith(EXCEL_TOKEN_PREFIX)).toBe(true)
    expect(r.expiresAt.getTime()).toBe(now.getTime() + LINK_TTL_MS)
    expect(codes.consumeAndLink).toHaveBeenCalledWith(
      "d1",
      expect.objectContaining({ userId: "u1", courseId: "c1", token: r.token }),
    )
  })

  it("gives the loser of a race no token", async () => {
    const { service, codes } = setup(approved as never)
    codes.consumeAndLink.mockResolvedValueOnce(null as never)
    await expect(service.collect("d".repeat(43), now)).resolves.toEqual({ status: "expired" })
  })
})

describe("revision", () => {
  it("returns the course's number", async () => {
    const { service, revisions } = setup()
    await expect(service.revision("c1")).resolves.toEqual({ revision: 7 })
    expect(revisions.read).toHaveBeenCalledWith("c1")
  })

  it("is 404 for a course that is gone", async () => {
    const { service, revisions } = setup()
    revisions.read.mockResolvedValueOnce(null)
    await expect(service.revision("c1")).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe("revoke", () => {
  it("is 404 for a link that is not the caller's or is gone", async () => {
    const { service, links } = setup()
    links.revoke.mockResolvedValueOnce(false)
    await expect(service.revoke("u1", "l9")).rejects.toBeInstanceOf(NotFoundError)
    expect(links.revoke).toHaveBeenCalledWith("u1", "l9")
  })
})

describe("addinFile (FR-75)", () => {
  const bytes = Buffer.from("PK-pretend-xlam")
  const sha = createHash("sha256").update(bytes).digest("hex")
  const file = (name: string) => pathToFileURL(join(mkdtempSync(join(tmpdir(), "cmas-")), name))

  it("refuses while the release names no SHA-256", async () => {
    await expect(setup().service.addinFile(file("none.xlam"), null)).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it("refuses when the file is missing", async () => {
    await expect(setup().service.addinFile(file("gone.xlam"), sha)).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it("refuses a file that no longer matches the published SHA-256", async () => {
    const url = file("swapped.xlam")
    writeFileSync(url, Buffer.from("something else"))
    await expect(setup().service.addinFile(url, sha)).rejects.toBeInstanceOf(NotFoundError)
  })

  it("hands over exactly the bytes whose hash was published", async () => {
    const url = file("ok.xlam")
    writeFileSync(url, bytes)
    expect(await setup().service.addinFile(url, sha)).toEqual(bytes)
  })
})

describe("workbook (the score workbook, connected on open)", () => {
  const API = "https://api.cmas.test"
  const template = fakeXlsm()
  const sha = createHash("sha256").update(template).digest("hex")
  const saved = () => {
    const url = pathToFileURL(join(mkdtempSync(join(tmpdir(), "cmas-")), "t.xlsm"))
    writeFileSync(url, template)
    return url
  }

  it("refuses while the release names no SHA-256, and creates no ticket", async () => {
    const { service, codes } = setup()
    await expect(service.workbook("u1", "c1", API, saved(), null)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(codes.create).not.toHaveBeenCalled()
  })

  it("refuses a template that no longer matches its SHA-256", async () => {
    const { service, codes } = setup()
    await expect(service.workbook("u1", "c1", API, saved(), "0".repeat(64))).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(codes.create).not.toHaveBeenCalled()
  })

  it("stamps the course, the address and a ticket approved for this caller and course", async () => {
    const { service, codes } = setup()
    const { bytes, fileName } = await service.workbook("u1", "c1", API, saved(), sha)

    const props = readCustomProperties(bytes)
    expect(props).toMatchObject({
      CmasApi: API,
      CmasCourseId: "c1",
      CmasCourseLabel: "90641001 วิชา Sec 01",
    })
    // The ticket is the device code whose user code was approved for u1 on c1.
    const [deviceCode, userCode] = codes.create.mock.calls[0]!
    expect(props.CmasTicket).toBe(deviceCode)
    expect(collectTokenSchema.safeParse({ deviceCode }).success).toBe(true)
    expect(codes.approve).toHaveBeenCalledWith(userCode, "u1", "c1")
    expect(fileName).toBe("CMAS 90641001 Sec 01 1-2569.xlsm")
  })

  it("hands every download its own ticket", async () => {
    const { service } = setup()
    const a = readCustomProperties((await service.workbook("u1", "c1", API, saved(), sha)).bytes)
    const b = readCustomProperties((await service.workbook("u1", "c1", API, saved(), sha)).bytes)
    expect(a.CmasTicket).not.toBe(b.CmasTicket)
  })
})

describe("apiOriginOf", () => {
  it("is http only on localhost, as the VBA allows, and https everywhere else", () => {
    expect(apiOriginOf("localhost:3001")).toBe("http://localhost:3001")
    expect(apiOriginOf("127.0.0.1:3001")).toBe("http://127.0.0.1:3001")
    expect(apiOriginOf("cmas.example.ac.th")).toBe("https://cmas.example.ac.th")
    expect(apiOriginOf("localhost.evil.test")).toBe("https://localhost.evil.test")
  })
})
