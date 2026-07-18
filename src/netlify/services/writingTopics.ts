import { http } from '../config/http';
import { ApiResponse, WritingTopic } from '../types';

export const writingTopicsApi = {
  getAll: (): Promise<ApiResponse<{ topics: WritingTopic[] }>> =>
    http.get<{ topics: WritingTopic[] }>('/writingTopics', 'getAll'),
};

export default writingTopicsApi;
