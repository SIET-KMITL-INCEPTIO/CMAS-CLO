import { apiClient } from "../../lib/apiClient.ts"
import type { Activity, Criteria, CriteriaMeta } from "./activity.types.ts"

export const activitiesApi = {
  list: (courseId: string) => apiClient.get<Activity[]>(`/courses/${courseId}/activities`),
  criteria: async (courseId: string) => {
    const { data, meta } = await apiClient.getWithMeta<Criteria>(`/courses/${courseId}/criteria`)
    return { ...data, meta: meta as CriteriaMeta }
  },
}
