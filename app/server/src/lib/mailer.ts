/**
 * Outgoing email (FR-07 sign-in links). One small seam so the service never
 * knows about SMTP, and tests pass their own.
 *
 * - SMTP_URL set: sent through it (any provider: the faculty's mail server,
 *   Google Workspace SMTP relay, a transactional service's SMTP endpoint).
 * - Unset, development/test: written to the server log, so a developer can
 *   sign in without a mail account. Never in production.
 * - Unset, production: null — the caller answers 503.
 */
import nodemailer from "nodemailer"
import { env } from "./env.js"

export type Mail = { to: string; subject: string; text: string; html: string }
export type Mailer = { send(mail: Mail): Promise<void> }

export function createMailer(): Mailer | null {
  if (env.SMTP_URL) {
    const transport = nodemailer.createTransport(env.SMTP_URL)
    return {
      async send(mail) {
        await transport.sendMail({ from: env.MAIL_FROM, ...mail })
      },
    }
  }
  if (env.NODE_ENV === "production") return null
  return {
    send(mail) {
      // Development only: the whole point is to show the link.
      console.info(`[mail → ${mail.to}] ${mail.subject}\n${mail.text}`)
      return Promise.resolve()
    },
  }
}
