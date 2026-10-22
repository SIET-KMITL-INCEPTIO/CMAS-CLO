import { useMutation, useQueryClient } from "@tanstack/react-query"
import { courseKeys } from "../courses/useCourses.ts"
import type { StudentInput } from "./student.types.ts"
import { studentsApi } from "./students.api.ts"

/** The roster feeds the grid, the list pane's count and the step bar — all under the course key. */
function useStudentWrite<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

export const useAddStudent = (courseId: string) =>
  useStudentWrite((body: StudentInput) => studentsApi.create(courseId, body))
export const useEditStudent = () =>
  useStudentWrite((a: { studentId: string; body: Partial<StudentInput> }) =>
    studentsApi.update(a.studentId, a.body),
  )
export const useDeleteStudent = () =>
  useStudentWrite((studentId: string) => studentsApi.remove(studentId))
export const useWithdrawStudent = () =>
  useStudentWrite((studentId: string) => studentsApi.withdraw(studentId))
export const useRestoreStudent = () =>
  useStudentWrite((studentId: string) => studentsApi.restore(studentId))
export const useCommitRosterImport = (courseId: string) =>
  useStudentWrite((previewToken: string) => studentsApi.commitImport(courseId, previewToken))
