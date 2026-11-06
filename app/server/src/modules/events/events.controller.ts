import type { FastifyReply, FastifyRequest } from "fastify"
import type { EventService } from "./events.service.js"
import { callerOf } from "../../middlewares/access.middleware.js"

/** A proxy or the browser drops an idle stream; a comment line every 25 s keeps it open. */
const PING_MS = 25_000
/**
 * The server ends every stream after 10 minutes and the client reconnects with
 * its current access token, so authMiddleware re-reads the live User row
 * (NFR-19) at least that often: a deactivated account stops hearing events.
 */
export const STREAM_LIFETIME_MS = 10 * 60_000

export class EventsController {
  constructor(private readonly service: EventService) {}

  /** GET /events — Server-Sent Events, one `data:` line per changed course. */
  stream = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = callerOf(req)
    reply.hijack()
    // Hijacking skips Fastify's own send, so the CORS and helmet headers set
    // by the onRequest hooks are copied over by hand.
    for (const [name, value] of Object.entries(reply.getHeaders())) {
      if (value !== undefined) reply.raw.setHeader(name, value)
    }
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    })
    const write = (chunk: string) => reply.raw.write(chunk)
    write("retry: 3000\n\n")

    const unsubscribe = this.service.subscribe({
      userId,
      role,
      send: (data) => write(`data: ${data}\n\n`),
    })
    const ping = setInterval(() => write(": ping\n\n"), PING_MS)
    const lifetime = setTimeout(() => reply.raw.end(), STREAM_LIFETIME_MS)
    req.raw.on("close", () => {
      clearInterval(ping)
      clearTimeout(lifetime)
      unsubscribe()
    })
  }
}
