import { useQuery } from '@tanstack/react-query';
import { slaPolicyService } from '../services/slaPolicyService';

export const useSlaPolicies = () => {
  return useQuery({
    queryKey: ['sla-policies'],
    queryFn: slaPolicyService.getPolicies,
  });
};
