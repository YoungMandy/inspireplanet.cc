import {
  WritingPost,
  WritingTemplate,
  WritingTemplatePrompt,
  WritingTopic,
} from '../types';

export const WRITING_POST_SELECT = `
  id,
  user_id,
  title,
  body,
  image_urls,
  template_id,
  template_snapshot,
  visibility,
  status,
  created_at,
  updated_at,
  author:users!writing_posts_user_id_fkey(id, name, username),
  topic_links:writing_post_topics(
    topic:writing_topics(id, name, slug, description, sort_order, is_user_created)
  )
`;

export function mapWritingTopic(row: any): WritingTopic {
  return {
    id: String(row.id),
    name: row.name || '',
    slug: row.slug || '',
    description: row.description || null,
    sort_order: Number(row.sort_order) || 0,
    is_user_created: Boolean(row.is_user_created),
  };
}

export function mapWritingTemplate(row: any): WritingTemplate {
  const prompts = Array.isArray(row.prompts) ? row.prompts : [];
  return {
    id: String(row.id),
    name: row.name || '',
    slug: row.slug || '',
    description: row.description || null,
    prompts: prompts.map(
      (prompt: any): WritingTemplatePrompt => ({
        key: String(prompt.key || ''),
        prompt: String(prompt.prompt || ''),
        placeholder: prompt.placeholder
          ? String(prompt.placeholder)
          : undefined,
        required: Boolean(prompt.required),
      })
    ),
    version: Number(row.version) || 1,
    sort_order: Number(row.sort_order) || 0,
  };
}

export function normalizeTemplateSnapshot(value: any) {
  if (!value || !Array.isArray(value.items)) return null;
  return {
    template_name: value.template_name || value.templateName || '',
    version: Number(value.version) || 1,
    items: value.items.map((item: any) => ({
      key: String(item.key || ''),
      prompt: String(item.prompt || ''),
      answer: String(item.answer || ''),
    })),
  };
}

export function mapWritingPost(
  row: any,
  currentUserId?: string | null
): WritingPost {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  const topicLinks = Array.isArray(row.topic_links) ? row.topic_links : [];

  return {
    id: String(row.id),
    user_id: String(row.user_id || ''),
    title: row.title || null,
    body: row.body || '',
    image_urls: Array.isArray(row.image_urls)
      ? row.image_urls.filter((url: unknown) => typeof url === 'string')
      : [],
    template_id: row.template_id ? String(row.template_id) : null,
    template_snapshot: normalizeTemplateSnapshot(row.template_snapshot),
    topics: topicLinks
      .map((link: any) => link?.topic)
      .filter(Boolean)
      .map(mapWritingTopic)
      .sort(
        (a: WritingTopic, b: WritingTopic) => a.sort_order - b.sort_order
      ),
    author: {
      id: author?.id ? String(author.id) : String(row.user_id || ''),
      name: author?.name || author?.username || '匿名用户',
      username: author?.username || null,
    },
    visibility: row.visibility === 'public' ? 'public' : 'private',
    status: row.status === 'hidden' ? 'hidden' : 'published',
    created_at: row.created_at,
    updated_at: row.updated_at,
    can_edit:
      Boolean(currentUserId) && String(row.user_id) === String(currentUserId),
  };
}
