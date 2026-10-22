import { apiClient } from "../../lib/apiClient.ts"
import type {
  Activity,
  ActivityInput,
  ActivityListMeta,
  Cell,
  Criteria,
  CriteriaMeta,
} from "./activity.types.ts"

export const activitiesApi = {
  list: async (courseId: string) => {
    const { data, meta } = await apiClient.getWithMeta<Activity[]>(
      `/courses/${courseId}/activities`,
    )
    return { activities: data, meta: meta as ActivityListMeta }
  },
  create: (courseId: string, body: ActivityInput) =>
    apiClient.post<Activity>(`/courses/${courseId}/activities`, body),
  update: (activityId: string, body: Partial<ActivityInput>) =>
    apiClient.patch<Activity>(`/activities/${activityId}`, body),
  reorder: (courseId: string, order: string[]) =>
    apiClient.patch(`/courses/${courseId}/activities/reorder`, { order }),
  /** Without ?confirm=true an activity that has scores answers 422 with how many. */
  remove: (activityId: string) =>
    apiClient.delete<{ deleted: true }>(`/activities/${activityId}?confirm=true`),
  duplicate: (activityId: string) =>
    apiClient.post<Activity>(`/activities/${activityId}/duplicate`),
  setGroupWeights: (
    courseId: string,
    body: { mode: "MANUAL" | "GROUP"; weights?: Record<string, number> },
  ) => apiClient.put(`/courses/${courseId}/group-weights`, body),

  criteria: async (courseId: string) => {
    const { data, meta } = await apiClient.getWithMeta<Criteria>(`/courses/${courseId}/criteria`)
    return { ...data, meta: meta as CriteriaMeta }
  },
  /** FR-44: the matrix is replaced as a whole; a cell left out is deleted. */
  replaceCriteria: (courseId: string, cells: Cell[]) =>
    apiClient.put(`/courses/${courseId}/criteria`, { cells }),
}
