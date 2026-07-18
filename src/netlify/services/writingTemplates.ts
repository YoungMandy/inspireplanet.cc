import { http } from '../config/http';
import { ApiResponse, WritingTemplate } from '../types';

export const writingTemplatesApi = {
  getAll: (): Promise<ApiResponse<{ templates: WritingTemplate[] }>> =>
    http.get<{ templates: WritingTemplate[] }>('/writingTemplates', 'getAll'),
};

export default writingTemplatesApi;
