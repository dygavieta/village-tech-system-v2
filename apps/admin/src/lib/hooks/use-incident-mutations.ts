/**
 * T176: Optimistic Updates for Incident Resolution
 * Custom hooks for incident mutations with optimistic UI updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resolveIncident, updateIncidentStatus } from '@/lib/actions/resolve-incident';

interface ResolveIncidentInput {
  incident_id: string;
  resolution_notes: string;
  status?: 'resolved' | 'dismissed';
}

interface IncidentData {
  id: string;
  status: 'reported' | 'responding' | 'resolved' | 'dismissed';
  resolution_notes?: string;
  resolved_by_admin_id?: string;
  resolved_at?: string;
  [key: string]: any;
}

/**
 * Hook for resolving incidents with optimistic updates
 */
export function useResolveIncidentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveIncident,

    // Optimistic update
    onMutate: async (variables: ResolveIncidentInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['incidents', 'active'] });
      await queryClient.cancelQueries({ queryKey: ['incident', variables.incident_id] });

      // Snapshot the previous values
      const previousIncidents = queryClient.getQueryData<IncidentData[]>(['incidents', 'active']);
      const previousIncident = queryClient.getQueryData<IncidentData>([
        'incident',
        variables.incident_id,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<IncidentData[]>(['incidents', 'active'], (old) => {
        if (!old) return old;

        // Remove the incident from active list
        return old.filter((incident) => incident.id !== variables.incident_id);
      });

      // Update individual incident query
      if (previousIncident) {
        queryClient.setQueryData<IncidentData>(['incident', variables.incident_id], {
          ...previousIncident,
          status: variables.status || 'resolved',
          resolution_notes: variables.resolution_notes,
          resolved_at: new Date().toISOString(),
        });
      }

      // Return context with previous values for rollback
      return { previousIncidents, previousIncident };
    },

    // On error, rollback to previous value
    onError: (err, variables, context) => {
      if (context?.previousIncidents) {
        queryClient.setQueryData(['incidents', 'active'], context.previousIncidents);
      }
      if (context?.previousIncident) {
        queryClient.setQueryData(['incident', variables.incident_id], context.previousIncident);
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', variables.incident_id] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
    },
  });
}

/**
 * Hook for updating incident status with optimistic updates
 */
export function useUpdateIncidentStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incidentId,
      status,
    }: {
      incidentId: string;
      status: 'reported' | 'responding' | 'resolved';
    }) => updateIncidentStatus(incidentId, status),

    // Optimistic update
    onMutate: async ({ incidentId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      await queryClient.cancelQueries({ queryKey: ['incident', incidentId] });

      // Snapshot the previous values
      const previousIncidents = queryClient.getQueryData<IncidentData[]>(['incidents', 'active']);
      const previousIncident = queryClient.getQueryData<IncidentData>(['incident', incidentId]);

      // Optimistically update the status
      queryClient.setQueryData<IncidentData[]>(['incidents', 'active'], (old) => {
        if (!old) return old;
        return old.map((incident) =>
          incident.id === incidentId ? { ...incident, status } : incident
        );
      });

      if (previousIncident) {
        queryClient.setQueryData<IncidentData>(['incident', incidentId], {
          ...previousIncident,
          status,
        });
      }

      // Return context with previous values for rollback
      return { previousIncidents, previousIncident };
    },

    // On error, rollback to previous value
    onError: (err, { incidentId }, context) => {
      if (context?.previousIncidents) {
        queryClient.setQueryData(['incidents', 'active'], context.previousIncidents);
      }
      if (context?.previousIncident) {
        queryClient.setQueryData(['incident', incidentId], context.previousIncident);
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, { incidentId }) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    },
  });
}
