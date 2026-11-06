/**
 * The one way a route reads an uploaded file (S-6): a single part named
 * "file", read into memory under the 10 MB cap set in app.ts, never written
 * to disk. Size and type problems are 400s with a message the instructor can act on.
 */
import type { FastifyRequest } from "fastify"
import { BadRequestError } from "./errors.js"

export async function readUpload(
  req: FastifyRequest,
): Promise<{ buffer: Buffer; fileName: string }> {
  if (!req.isMultipart()) throw new BadRequestError("ส่งไฟล์แบบ multipart/form-data ในช่อง file")
  const part = await req.file()
  if (!part || part.fieldname !== "file") throw new BadRequestError("ไม่พบไฟล์ในช่อง file")
  let buffer: Buffer
  try {
    buffer = await part.toBuffer()
  } catch {
    throw new BadRequestError("ไฟล์ใหญ่เกิน 10 MB")
  }
  return { buffer, fileName: part.filename.slice(0, 200) || "upload.xlsx" }
}
