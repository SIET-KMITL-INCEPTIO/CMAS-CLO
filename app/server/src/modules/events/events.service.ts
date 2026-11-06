/**
 * Live updates: after a write to a course succeeds, every open tab that may
 * see that course is told "course X changed" and refetches it through the
 * normal GET routes. Only the id travels, so the data is still read through
 * authorize() and a course the caller cannot see is never named to them (A-13).
 *
 * One server process, so subscribers live in a Set. A second instance would
 * need a shared channel (Postgres LISTEN/NOTIFY) before this scales out.
 */
import { CourseInstructorRepository } from "./course-instructor.repository.js"

export type Subscriber = {
  userId: string
  /** From the live User row when the stream opened; the stream is closed well before a role change could matter (STREAM_LIFETIME_MS). */
  role: "ADMIN" | "INSTRUCTOR"
  send: (data: string) => void
}

export type CourseChanged = {
  courseId: string
  /** The X-Client-Id of the tab that wrote, so that tab can skip its own echo. */
  origin?: string
}

export class EventService {
  private readonly subscribers = new Set<Subscriber>()

  constructor(private readonly instructors: Pick<CourseInstructorRepository, "userIdsOf">) {}

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber)
    return () => this.subscribers.delete(subscriber)
  }

  get size() {
    return this.subscribers.size
  }

  /**
   * ADMIN sees every course (D-1); an instructor only the courses they teach.
   * The writer is always included: after deleting a course nobody teaches it
   * any more, and their other tabs still need to drop it.
   */
  async courseChanged(event: CourseChanged, writerId: string): Promise<void> {
    if (this.subscribers.size === 0) return
    const allowed = new Set(await this.instructors.userIdsOf(event.courseId))
    allowed.add(writerId)
    const data = JSON.stringify(event)
    for (const s of this.subscribers) {
      if (s.role === "ADMIN" || allowed.has(s.userId)) s.send(data)
    }
  }
}

export const events = new EventService(new CourseInstructorRepository())
