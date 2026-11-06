/**
 * The account picture from Google, front end only: the ID token Google hands
 * the browser at sign-in carries a `picture` claim. The server does not keep
 * it, so it is remembered here per account; a reload or a new tab reads it
 * back. Another browser shows initials until its first Google sign-in.
 */
const KEY = (userId: string) => `cmas.avatar.${userId}`

/** Only Google's own image host — nothing else from the token is ever put in an <img>. */
const ALLOWED = /^https:\/\/[a-z0-9-]+\.googleusercontent\.com\//

export function pictureFromCredential(credential: string): string | null {
  try {
    const payload = credential.split(".")[1] ?? ""
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const picture: unknown = (JSON.parse(json) as { picture?: unknown }).picture
    return typeof picture === "string" && ALLOWED.test(picture) ? picture : null
  } catch {
    return null
  }
}

export function savePicture(userId: string, url: string | null) {
  try {
    if (url) localStorage.setItem(KEY(userId), url)
    else localStorage.removeItem(KEY(userId))
  } catch {
    /* private window — initials instead */
  }
}

export function loadPicture(userId: string): string | null {
  try {
    const url = localStorage.getItem(KEY(userId))
    return url && ALLOWED.test(url) ? url : null
  } catch {
    return null
  }
}
