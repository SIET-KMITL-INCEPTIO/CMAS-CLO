import type { FastifyInstance } from "fastify"
import { ExcelController } from "./excel.controller.js"
import { ExcelDeviceCodeRepository } from "./excel-device-code.repository.js"
import { ExcelLinkRepository } from "./excel-link.repository.js"
import { ExcelService } from "./excel.service.js"

// Per IP per 15 minutes. /excel/device and /excel/token are public on purpose:
// they ARE how the add-in signs in, like /auth/google (S-5).
const START_LIMIT = { max: 10, timeWindow: "15 minutes" }
// One poll every 5 s for the 10 minutes a code lives is 120; leave room for two add-ins behind one NAT.
const POLL_LIMIT = { max: 300, timeWindow: "15 minutes" }
// Guessing a live userCode: 32^8 codes against 10 tries per 15 minutes.
const APPROVE_LIMIT = { max: 10, timeWindow: "15 minutes" }

// Registered without a prefix: approving belongs under the course it is for (A-1, A-8).
export async function excelRoutes(app: FastifyInstance) {
  const controller = new ExcelController(
    new ExcelService(new ExcelDeviceCodeRepository(), new ExcelLinkRepository()),
  )

  app.post(
    "/excel/device",
    { config: { access: "public", rateLimit: START_LIMIT } },
    controller.start,
  )
  app.post(
    "/excel/token",
    { config: { access: "public", rateLimit: POLL_LIMIT } },
    controller.collect,
  )
  app.get("/excel/addin", { config: { access: "public" } }, controller.release)
  // The file itself needs a web sign-in ("authenticated" refuses an add-in token): it is
  // not code-signed, so it is handed out only from CMAS, next to its SHA-256.
  app.get("/excel/addin/file", { config: { access: "authenticated" } }, controller.addinFile)

  // The instructor approves the code Excel shows, for this course. score.edit,
  // checked by the access hook: 404 for a course they cannot see, 403 for ADMIN (D-1).
  // webSessionOnly: an add-in token for this very course is still refused.
  app.post(
    "/courses/:courseId/excel-links",
    {
      config: { access: { cap: "score.edit" }, webSessionOnly: true, rateLimit: APPROVE_LIMIT },
    },
    controller.approve,
  )
  // FR-76: polled every 10 s by the add-in; reading the course is enough.
  app.get(
    "/courses/:courseId/revision",
    { config: { access: { cap: "course.view" } } },
    controller.revision,
  )

  // The caller's own connections. "authenticated" already refuses an add-in token.
  app.get("/excel/links", { config: { access: "authenticated" } }, controller.list)
  app.delete("/excel/links/:linkId", { config: { access: "authenticated" } }, controller.revoke)
}
