import { beforeEach, describe, expect, it } from "vitest"
import { loadPicture, pictureFromCredential, savePicture } from "./avatar.ts"

const token = (claims: object) =>
  `h.${btoa(JSON.stringify(claims)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.s`

describe("avatar", () => {
  beforeEach(() => localStorage.clear())

  it("reads Google's picture claim", () => {
    const url = "https://lh3.googleusercontent.com/a/abc=s96-c"
    expect(pictureFromCredential(token({ picture: url }))).toBe(url)
  })

  it("refuses any other host, and a broken token", () => {
    expect(pictureFromCredential(token({ picture: "https://evil.example/x.png" }))).toBeNull()
    expect(pictureFromCredential(token({ picture: "javascript:alert(1)" }))).toBeNull()
    expect(pictureFromCredential("not-a-token")).toBeNull()
  })

  it("remembers the picture per account", () => {
    savePicture("u1", "https://lh3.googleusercontent.com/a/x")
    expect(loadPicture("u1")).toBe("https://lh3.googleusercontent.com/a/x")
    expect(loadPicture("u2")).toBeNull()
    savePicture("u1", null)
    expect(loadPicture("u1")).toBeNull()
  })
})
