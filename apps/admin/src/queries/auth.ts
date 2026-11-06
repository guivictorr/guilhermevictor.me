import { queryOptions } from "@tanstack/react-query"
import { getViewer } from "@/server/auth.functions"

export const viewerQuery = () =>
  queryOptions({
    queryKey: ["viewer"],
    queryFn: () => getViewer(),
    staleTime: 5 * 60_000,
    // Every navigation's guard reads it (__root beforeLoad); evicting it
    // would make the next tap wait on the server before switching pages.
    gcTime: Infinity,
  })
