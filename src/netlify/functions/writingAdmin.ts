import { supabase } from '../../database/supabase';
import { NetlifyEvent, NetlifyResponse } from '../types';
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  getDataFromEvent,
  getFunctionNameFromEvent,
  handleOptionsRequest,
} from '../utils/server';
import { mapWritingTemplate, mapWritingTopic } from '../utils/writing';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod === 'OPTIONS') return handleOptionsRequest();
  const user = await getAuthenticatedUser(event);
  if (!user) return createErrorResponse('未授权', 401);
  if (user.role !== 'organizer')
    return createErrorResponse('需要管理员权限', 403);
  const action = getFunctionNameFromEvent(event);
  const input = getDataFromEvent(event);

  if (action === 'dashboard') {
    const [
      posts,
      publicPosts,
      writers,
      resonances,
      comments,
      topicLinks,
      topics,
      templates,
    ] = await Promise.all([
      supabase
        .from('writing_posts')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('writing_posts')
        .select('id', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .eq('status', 'published'),
      supabase.from('writing_posts').select('user_id'),
      supabase
        .from('writing_resonances')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('writing_comments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase.from('writing_post_topics').select('topic_id'),
      supabase
        .from('writing_topics')
        .select('id, name, slug, description, sort_order, is_user_created')
        .order('sort_order'),
      supabase
        .from('writing_templates')
        .select('id, name, slug, description, prompts, version, sort_order')
        .order('sort_order'),
    ]);
    if (topics.error || templates.error)
      return createErrorResponse('获取后台数据失败', 500);
    const counts = new Map<string, number>();
    (topicLinks.data || []).forEach((row) =>
      counts.set(
        String(row.topic_id),
        (counts.get(String(row.topic_id)) || 0) + 1
      )
    );
    const mappedTopics = (topics.data || []).map(mapWritingTopic);
    return createSuccessResponse({
      stats: {
        total_posts: posts.count || 0,
        public_posts: publicPosts.count || 0,
        active_writers: new Set(
          (writers.data || []).map((row) => String(row.user_id))
        ).size,
        total_resonances: resonances.count || 0,
        total_comments: comments.count || 0,
        popular_topics: mappedTopics
          .map((topic) => ({ ...topic, post_count: counts.get(topic.id) || 0 }))
          .sort((a, b) => b.post_count - a.post_count)
          .slice(0, 10),
      },
      topics: mappedTopics,
      templates: (templates.data || []).map(mapWritingTemplate),
    });
  }

  if (action === 'saveTopic') {
    const name = String(input.name || '').trim();
    if (!name || name.length > 40)
      return createErrorResponse('话题名称需为 1-40 个字');
    const payload = {
      name,
      slug: slugify(String(input.slug || name)) || `topic-${Date.now()}`,
      description: String(input.description || '').trim() || null,
      sort_order: Number(input.sort_order) || 0,
      is_active: true,
    };
    const query = input.id
      ? supabase.from('writing_topics').update(payload).eq('id', input.id)
      : supabase.from('writing_topics').insert(payload);
    const { data, error } = await query
      .select('id, name, slug, description, sort_order, is_user_created')
      .single();
    if (error || !data)
      return createErrorResponse('保存话题失败，请检查名称或标识是否重复', 400);
    return createSuccessResponse(
      { topic: mapWritingTopic(data) },
      input.id ? 200 : 201
    );
  }

  if (action === 'saveTemplate') {
    const name = String(input.name || '').trim();
    const prompts = Array.isArray(input.prompts)
      ? input.prompts
          .map((item: any, index: number) => ({
            key: String(item.key || `item-${index + 1}`).trim(),
            prompt: String(item.prompt || '').trim(),
            placeholder: String(item.placeholder || '').trim(),
            required: Boolean(item.required),
          }))
          .filter((item: any) => item.prompt)
      : [];
    if (!name || name.length > 60)
      return createErrorResponse('模板名称需为 1-60 个字');
    if (!prompts.length || prompts.length > 10)
      return createErrorResponse('模板需包含 1-10 个问题');
    const payload: any = {
      name,
      slug: slugify(String(input.slug || name)) || `template-${Date.now()}`,
      description: String(input.description || '').trim() || null,
      prompts,
      sort_order: Number(input.sort_order) || 0,
      is_active: true,
    };
    if (input.id) payload.version = (Number(input.version) || 1) + 1;
    const query = input.id
      ? supabase.from('writing_templates').update(payload).eq('id', input.id)
      : supabase.from('writing_templates').insert(payload);
    const { data, error } = await query
      .select('id, name, slug, description, prompts, version, sort_order')
      .single();
    if (error || !data)
      return createErrorResponse('保存模板失败，请检查名称或标识是否重复', 400);
    return createSuccessResponse(
      { template: mapWritingTemplate(data) },
      input.id ? 200 : 201
    );
  }
  return createErrorResponse('无效的操作类型');
}
