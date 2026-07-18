import { http } from '../config/http';
import {
  ApiResponse,
  WritingAdminStats,
  WritingTemplate,
  WritingTopic,
} from '../types';

export const writingAdminApi = {
  dashboard: (): Promise<
    ApiResponse<{
      stats: WritingAdminStats;
      topics: WritingTopic[];
      templates: WritingTemplate[];
    }>
  > => http.get('/writingAdmin', 'dashboard'),
  saveTopic: (
    topic: Partial<WritingTopic>
  ): Promise<ApiResponse<{ topic: WritingTopic }>> =>
    topic.id
      ? http.put('/writingAdmin', 'saveTopic', topic)
      : http.post('/writingAdmin', 'saveTopic', topic),
  saveTemplate: (
    template: Partial<WritingTemplate>
  ): Promise<ApiResponse<{ template: WritingTemplate }>> =>
    template.id
      ? http.put('/writingAdmin', 'saveTemplate', template)
      : http.post('/writingAdmin', 'saveTemplate', template),
};

export default writingAdminApi;
