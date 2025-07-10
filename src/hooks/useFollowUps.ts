
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/apiClient';
import { toast } from '@/components/ui/use-toast';

export interface FollowUp {
  followup_id: string;
  order_id: string;
  followup_date: string;
  notes: string;
  status: 'Pending' | 'Completed' | 'Pending Moderator' | 'Package to Confirmation' | 'In Review' | 'Delivered' | 'Cancelled' | 'Office Received';
  moderator_id?: string;
  customer_name?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export const useFollowUps = () => {
  return useQuery({
    queryKey: ['followUps'],
    queryFn: api.getFollowUps,
  });
};

export const useCreateFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followUpData: Partial<FollowUp>) => api.createFollowUp(followUpData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      toast({
        title: "Success",
        description: "Follow-up created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create follow-up",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<FollowUp>) => 
      api.updateFollowUp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      toast({
        title: "Success", 
        description: "Follow-up updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow-up",
        variant: "destructive",
      });
    },
  });
};
