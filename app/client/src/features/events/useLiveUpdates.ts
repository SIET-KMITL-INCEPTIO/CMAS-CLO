import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { refreshSession, TAB_ID } from "../../lib/apiClient.ts"
import { useAuthStore } from "../auth/useAuthStore.ts"
import { courseKeys } from "../courses/useCourses.ts"
import { streamEvents, type CourseChanged } from "./events.api.ts"

const MAX_DELAY_MS = 30_000
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true })
  })

/**
 * While signed in, keeps one live stream open. When another tab or another
 * instructor changes a course, that course's queries (every page under
 * courseKeys.one) and the course list are refetched — no reload needed.
 */
export function useLiveUpdates() {
  const queryClient = useQueryClient()
  const signedIn = useAuthStore((s) => s.status === "in")

  useEffect(() => {
    if (!signedIn) return
    const ctl = new AbortController()

    const onEvent = ({ courseId, origin }: CourseChanged) => {
      if (origin === TAB_ID) return // our own write already invalidated these
      void queryClient.invalidateQueries({ queryKey: courseKeys.one(courseId) })
      void queryClient.invalidateQueries({ queryKey: courseKeys.list() })
    }

    let opened = 0
    const onOpen = () => {
      // A reconnect (the server ends each stream after 10 minutes, or it was
      // restarted): anything written in the gap was not heard, so reload once.
      if (opened++ > 0) void queryClient.invalidateQueries({ queryKey: courseKeys.all })
    }

    void (async () => {
      let delay = 1_000
      while (!ctl.signal.aborted) {
        const token = useAuthStore.getState().accessToken
        const status = token
          ? await streamEvents(token, { onOpen, onEvent }, ctl.signal).catch(() => 0)
          : 401
        if (ctl.signal.aborted) return
        if (status === 401 && !(await refreshSession())) return // apiClient signs the tab out
        if (status === 200) delay = 1_000
        await sleep(delay, ctl.signal)
        delay = Math.min(delay * 2, MAX_DELAY_MS)
      }
    })()

    return () => ctl.abort()
  }, [signedIn, queryClient])
}
