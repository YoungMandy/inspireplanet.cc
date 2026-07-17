export type WritingVisibility = 'public' | 'private';
export type WritingStatus = 'published' | 'hidden';

export interface WritingTopic {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  is_user_created?: boolean;
}

export interface WritingTemplatePrompt {
  key: string;
  prompt: string;
  placeholder?: string;
  required?: boolean;
}

export interface WritingTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  prompts: WritingTemplatePrompt[];
  version: number;
  sort_order: number;
}

export interface WritingTemplateAnswer {
  key: string;
  prompt: string;
  answer: string;
}

export interface WritingTemplateSnapshot {
  template_name: string;
  version: number;
  items: WritingTemplateAnswer[];
}

export interface WritingAuthor {
  id: string;
  name: string;
  username?: string | null;
}

export interface WritingPost {
  id: string;
  user_id: string;
  title?: string | null;
  body: string;
  image_urls: string[];
  template_id?: string | null;
  template_snapshot?: WritingTemplateSnapshot | null;
  topics: WritingTopic[];
  author: WritingAuthor;
  visibility: WritingVisibility;
  status: WritingStatus;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
  resonance_count: number;
  has_resonated: boolean;
  comment_count: number;
}

export interface WritingComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  author: WritingAuthor;
  created_at: string;
  can_delete: boolean;
}

export interface WritingAdminStats {
  total_posts: number;
  public_posts: number;
  active_writers: number;
  total_resonances: number;
  total_comments: number;
  popular_topics: Array<WritingTopic & { post_count: number }>;
}

export interface WritingAnswerInput {
  key: string;
  answer: string;
}

export interface CreateWritingRequest {
  title?: string;
  body: string;
  image_urls?: string[];
  template_id?: string | null;
  template_answers?: WritingAnswerInput[];
  topic_ids?: string[];
  visibility: WritingVisibility;
}

export type UpdateWritingRequest = CreateWritingRequest;

export interface WritingListParams {
  scope?: 'all' | 'mine';
  topic_ids?: string[];
  sort?: 'latest' | 'oldest';
  page?: number;
  page_size?: number;
}

export interface WritingListResponse {
  records: WritingPost[];
  total: number;
  page: number;
  page_size: number;
}
