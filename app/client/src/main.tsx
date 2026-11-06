import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { toast } from "sonner"
import App from "./App.tsx"
import { ApiError } from "./lib/apiClient.ts"
import "./index.css"

/**
 * An error nobody handled is shown once, here. A page that shows its own —
 * a 422 under a field, a 409 on the cells that collided — sets
 * `meta: { silent: true }` on the query or mutation.
 */
const showError = (err: unknown, meta: Record<string, unknown> | undefined) => {
  if (meta?.silent) return
  if (err instanceof ApiError && err.status === 401) return // the session guard sends the user to sign in
  toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง")
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (err, query) => showError(err, query.meta) }),
  mutationCache: new MutationCache({
    onError: (err, _vars, _ctx, mutation) => showError(err, mutation.meta),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 4xx will not change on retry (404 is "not yours" by design, A-13).
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 1,
    },
  },
})

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element #root not found")

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
