/**
 * Two buckets per IP for the global rate limit (app.ts): the web app's, and the Excel
 * add-in's. A score workbook polls on its own every few seconds, and a campus puts many
 * instructors behind one IP; in a single bucket a room of open workbooks would use up the
 * web app's budget and every page would answer 429.
 *
 * Still keyed by IP, never by the token itself: a key taken from a header the caller
 * writes could be changed on every request to dodge the limit. A forged "cmasx_" header
 * only moves that caller into the Excel bucket, which is limited too.
 */
import type { FastifyRequest } from "fastify"
import { EXCEL_TOKEN_PREFIX } from "../modules/excel/excel.service.js"

const EXCEL_BUCKET = "excel:"

export const rateLimitKey = (req: FastifyRequest): string =>
  req.headers.authorization?.startsWith(`Bearer ${EXCEL_TOKEN_PREFIX}`)
    ? EXCEL_BUCKET + req.ip
    : req.ip

export const rateLimitMax =
  (web: number, excel: number) =>
  (_req: FastifyRequest, key: string): number =>
    key.startsWith(EXCEL_BUCKET) ? excel : web
