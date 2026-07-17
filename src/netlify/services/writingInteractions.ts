import { http } from '../config/http';
import { ApiResponse, WritingComment } from '../types';

export const writingInteractionsApi = {
  get: (
    postId: string
  ): Promise<
    ApiResponse<{
      resonance_count: number;
      has_resonated: boolean;
      comments: WritingComment[];
    }>
  > => http.get('/writingInteractions', 'get', { post_id: postId }),
  toggleResonance: (
    postId: string
  ): Promise<
    ApiResponse<{ resonance_count: number; has_resonated: boolean }>
  > =>
    http.post('/writingInteractions', 'toggleResonance', { post_id: postId }),
  addComment: (
    postId: string,
    content: string,
    parentId?: string | null
  ): Promise<ApiResponse<{ comment: WritingComment }>> =>
    http.post('/writingInteractions', 'addComment', {
      post_id: postId,
      content,
      parent_id: parentId || null,
    }),
  deleteComment: (id: string): Promise<ApiResponse<{ id: string }>> =>
    http.delete('/writingInteractions', 'deleteComment', { id }),
};

export default writingInteractionsApi;
