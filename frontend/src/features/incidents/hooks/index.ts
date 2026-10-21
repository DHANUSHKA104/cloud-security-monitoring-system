import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentService, IncidentFilters, CreateIncidentPayload } from '../services/incidentService';
import { IncidentStatus } from '@/types';

export const useIncidents = (filters?: IncidentFilters) => {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => incidentService.getIncidents(filters),
  });
};

export const useIncident = (id: string) => {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentService.getIncidentById(id),
    enabled: !!id,
  });
};

export const useIncidentTimeline = (id: string) => {
  return useQuery({
    queryKey: ['incident-timeline', id],
    queryFn: () => incidentService.getTimeline(id),
    enabled: !!id,
  });
};

export const useIncidentActions = (incidentId?: string) => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateIncidentPayload) => incidentService.createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: IncidentStatus; note?: string }) =>
      incidentService.changeStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, assigneeId, reason }: { id: string; assigneeId: string; reason: string }) =>
      incidentService.reassign(id, assigneeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    },
  });

  return {
    createIncident: createMutation.mutateAsync,
    changeStatus: changeStatusMutation.mutateAsync,
    reassign: reassignMutation.mutateAsync,
  };
};
