import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useReports = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['reports', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/api/orders/reports', {
        params: { startDate, endDate }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
