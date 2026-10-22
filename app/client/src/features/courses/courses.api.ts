import { apiClient } from "../../lib/apiClient.ts"
import type { PageMeta } from "../../types/api.types.ts"
import type { Course } from "./course.types.ts"

export const coursesApi = {
  /** Every course the caller can see — an instructor's own, ADMIN's all (NFR-06). */
  list: async (q?: string) => {
    const params = new URLSearchParams({ perPage: "100", sort: "code:asc", ...(q ? { q } : {}) })
    const { data, meta } = await apiClient.getWithMeta<Course[]>(`/courses?${params}`)
    return { courses: data, meta: meta as PageMeta }
  },
  get: (courseId: string) => apiClient.get<Course>(`/courses/${courseId}`),
}
