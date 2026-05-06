import { useQuery } from "@tanstack/react-query";
import { sibaApi } from "@/api/apiClient";

export function useEntityList(entityName, params = {}, enabled = true) {
  return useQuery({
    queryKey: [entityName, params],
    queryFn: () => sibaApi.entities[entityName].filter(params, "-created_date", 500),
    enabled,
  });
}
