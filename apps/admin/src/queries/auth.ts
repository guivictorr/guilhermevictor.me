import { queryOptions } from "@tanstack/react-query"
import { getViewer } from "@/server/auth.functions"

export const viewerQuery = () =>
  queryOptions({
    queryKey: ["viewer"],
    queryFn: () => getViewer(),
    staleTime: 5 * 60_000,
  })
