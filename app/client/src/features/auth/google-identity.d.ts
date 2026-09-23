/**
 * Minimal ambient shape for the Google Identity Services script (loaded from
 * index.html, not npm — there is no @types package for it). Only the pieces
 * Login.page.tsx actually calls.
 */
export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}
