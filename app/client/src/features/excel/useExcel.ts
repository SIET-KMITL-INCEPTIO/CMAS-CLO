import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { excelApi } from "./excel.api.ts"

export const excelKeys = {
  links: ["excel", "links"] as const,
}

export const useExcelLinks = () =>
  useQuery({ queryKey: excelKeys.links, queryFn: () => excelApi.links() })

/** Both writes change the list of connections. */
function useExcelWrite<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: excelKeys.links }),
  })
}

export const useApproveExcel = () =>
  useExcelWrite((body: { userCode: string; courseId: string }) => excelApi.approve(body))
export const useRevokeExcel = () => useExcelWrite((linkId: string) => excelApi.revoke(linkId))

/** "abcd 2345" → "ABCD-2345", as Excel shows it. Only the alphabet the server issues. */
export function formatUserCode(raw: string): string {
  const clean = raw
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
    .slice(0, 8)
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}
