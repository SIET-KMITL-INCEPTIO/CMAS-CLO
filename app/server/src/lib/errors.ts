/**
 * Errors a service may throw on purpose. errorHandler turns each into its
 * status code; anything else is a 500.
 *
 * Course not found lives in modules/authorization/authorization.service.ts
 * (CourseNotFoundError) because "not found" and "not yours" must be the same
 * error there, byte for byte (A-13).
 */
export class AppError extends Error {
  constructor(
    readonly statusCode: 400 | 403 | 404 | 409 | 422,
    message: string,
    /** What the caller needs to fix it, e.g. which scores are above a new maxScore. */
    readonly errors?: unknown,
  ) {
    super(message)
    this.name = new.target.name
  }
}

/** A request a schema cannot express as wrong, e.g. an upload that is not an .xlsx (S-6). */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message)
  }
}

/** The caller can see the course but does not hold the capability (D-1: ADMIN on teaching work). */
export class ForbiddenError extends AppError {
  constructor(message = "คุณไม่มีสิทธิ์ทำรายการนี้") {
    super(403, message)
  }
}

/**
 * A row inside a course the caller can see does not exist (an instructor not
 * on the course, a CLO of another course named in a body). Not for the course
 * itself: that is CourseNotFoundError, whose body must match "not yours".
 */
export class NotFoundError extends AppError {
  constructor(message = "ไม่พบข้อมูลที่ระบุ") {
    super(404, message)
  }
}

/** Two writers raced, or a unique key already exists (D-3, P2002). */
export class ConflictError extends AppError {
  constructor(
    message = "ข้อมูลนี้มีอยู่แล้วหรือถูกแก้ไขไปก่อนหน้า กรุณาโหลดใหม่",
    errors?: unknown,
  ) {
    super(409, message, errors)
  }
}

/** A business rule refused the write (A-11). The message says how to fix it. */
export class BusinessRuleError extends AppError {
  constructor(message: string, errors?: unknown) {
    super(422, message, errors)
  }
}
