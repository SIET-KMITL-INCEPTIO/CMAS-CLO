import { useOutletContext } from "react-router-dom"
import type { Course } from "./course.types.ts"

export type CourseContext = { course: Course }

/** The course of the page being rendered — only valid under CourseLayout. */
export const useCourseContext = () => useOutletContext<CourseContext>()
