import { apiClient } from "../../lib/apiClient.ts"
import type { Clo, CloInput, CloListMeta, Objective, ObjectiveInput } from "./clo.types.ts"

/** DELETE without ?confirm=true on something still measured answers 422 with what would go. */
const confirmed = (url: string) => apiClient.delete<{ deleted: true }>(`${url}?confirm=true`)

export const closApi = {
  list: async (courseId: string) => {
    const { data, meta } = await apiClient.getWithMeta<Clo[]>(`/courses/${courseId}/clos`)
    return { clos: data, meta: meta as CloListMeta }
  },
  create: (courseId: string, body: CloInput) =>
    apiClient.post<Clo>(`/courses/${courseId}/clos`, body),
  update: (cloId: string, body: Partial<CloInput>) => apiClient.patch<Clo>(`/clos/${cloId}`, body),
  reorder: (courseId: string, order: string[]) =>
    apiClient.patch(`/courses/${courseId}/clos/reorder`, { order }),
  remove: (cloId: string) => confirmed(`/clos/${cloId}`),

  objectives: (cloId: string) => apiClient.get<Objective[]>(`/clos/${cloId}/objectives`),
  createObjective: (cloId: string, body: ObjectiveInput) =>
    apiClient.post<Objective>(`/clos/${cloId}/objectives`, body),
  updateObjective: (objectiveId: string, body: Partial<ObjectiveInput>) =>
    apiClient.patch<Objective>(`/objectives/${objectiveId}`, body),
  removeObjective: (objectiveId: string) => confirmed(`/objectives/${objectiveId}`),
}
