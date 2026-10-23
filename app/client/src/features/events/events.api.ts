/**
 * GET /events — the server's live "course changed" stream (Server-Sent Events).
 *
 * Read with fetch, not EventSource: EventSource cannot send the Authorization
 * header, and the access token must not go in the URL where logs keep it.
 */
import { API_URL } from "../../lib/app.constants.ts"
import { TAB_ID } from "../../lib/apiClient.ts"

export type CourseChanged = { courseId: string; origin?: string }

/** Streams until the server ends it (every 10 minutes) or `signal` aborts. Resolves with the HTTP status. */
export async function streamEvents(
  token: string,
  handlers: { onOpen: () => void; onEvent: (event: CourseChanged) => void },
  signal: AbortSignal,
): Promise<number> {
  const res = await fetch(`${API_URL}/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Client-Id": TAB_ID,
      Accept: "text/event-stream",
    },
    credentials: "include",
    signal,
  })
  if (!res.ok || !res.body) return res.status
  handlers.onOpen()

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ""
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return res.status
    buffer += value
    const frames = buffer.split("\n\n")
    buffer = frames.pop() ?? ""
    for (const frame of frames) {
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6))
        .join("\n")
      if (!data) continue // a ping or the retry hint
      try {
        handlers.onEvent(JSON.parse(data) as CourseChanged)
      } catch {
        // A malformed frame is skipped, not fatal to the stream.
      }
    }
  }
}
