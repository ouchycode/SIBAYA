import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useEntityList(entityName, params = {}, enabled = true) {
  return useQuery({
    queryKey: [entityName, params],
    queryFn: () => base44.entities[entityName].filter(params, "-created_date", 500),
    enabled,
  });
}
