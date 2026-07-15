import { ApiResponse } from '../types/http';
import { http } from '../config/http';

export const submissionsApi = {
  send: async (data: {
    name: string;
    email: string;
    content: string;
    website?: string;
  }): Promise<ApiResponse<{ success: boolean }>> => {
    return http.post<{ success: boolean }>(
      '/sendSubmission',
      'sendSubmission',
      data
    );
  },
};

export default submissionsApi;
