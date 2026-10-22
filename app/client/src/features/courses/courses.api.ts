import { apiClient } from "../../lib/apiClient.ts"
import type { PageMeta } from "../../types/api.types.ts"
import type {
  Course,
  CourseImpact,
  CourseInput,
  CourseWithReadiness,
  InstructorHit,
} from "./course.types.ts"

export const coursesApi = {
  /** Every course the caller can see — an instructor's own, ADMIN's all (NFR-06). */
  list: async (q?: string) => {
    const params = new URLSearchParams({ perPage: "100", sort: "code:asc", ...(q ? { q } : {}) })
    const { data, meta } = await apiClient.getWithMeta<CourseWithReadiness[]>(`/courses?${params}`)
    return { courses: data, meta: meta as PageMeta }
  },
  get: (courseId: string) => apiClient.get<CourseWithReadiness>(`/courses/${courseId}`),
  create: (body: CourseInput & { instructors: { userId: string }[] }) =>
    apiClient.post<Course>("/courses", body),
  update: (courseId: string, body: Partial<CourseInput>) =>
    apiClient.patch<Course>(`/courses/${courseId}`, body),
  impact: (courseId: string) => apiClient.get<CourseImpact>(`/courses/${courseId}/impact`),
  remove: (courseId: string) =>
    apiClient.delete<{ deleted: true }>(`/courses/${courseId}?confirm=true`),
  duplicate: (courseId: string) => apiClient.post<Course>(`/courses/${courseId}/duplicate`),
  addInstructor: (courseId: string, userId: string) =>
    apiClient.post(`/courses/${courseId}/instructors`, { userId }),
  removeInstructor: (courseId: string, userId: string) =>
    apiClient.delete(`/courses/${courseId}/instructors/${userId}`),
  /** G1 — accounts that can be put on a course. */
  searchInstructors: (q: string) =>
    apiClient.get<InstructorHit[]>(`/users/instructors?${new URLSearchParams({ q })}`),
}
