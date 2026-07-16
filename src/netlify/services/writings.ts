import { http } from '../config/http';
import {
  ApiResponse,
  CreateWritingRequest,
  UpdateWritingRequest,
  WritingListParams,
  WritingListResponse,
  WritingPost,
} from '../types';

export const writingsApi = {
  list: (
    params: WritingListParams = {}
  ): Promise<ApiResponse<WritingListResponse>> =>
    http.get<WritingListResponse>('/writings', 'getAll', {
      ...params,
      topic_ids: params.topic_ids?.join(','),
    }),

  getById: (id: string): Promise<ApiResponse<{ post: WritingPost }>> =>
    http.get<{ post: WritingPost }>('/writings', 'getById', { id }),

  create: (
    payload: CreateWritingRequest
  ): Promise<ApiResponse<{ post: WritingPost }>> =>
    http.post<{ post: WritingPost }>('/writings', 'create', payload),

  update: (
    id: string,
    payload: UpdateWritingRequest
  ): Promise<ApiResponse<{ post: WritingPost }>> =>
    http.put<{ post: WritingPost }>('/writings', 'update', { id, ...payload }),

  delete: (id: string): Promise<ApiResponse<{ id: string }>> =>
    http.delete<{ id: string }>('/writings', 'delete', { id }),
};

export default writingsApi;
