import { supabase } from '../../database/supabase';
import { extractHashtags } from '../../utils/hashtags';
import {
  CreateWritingRequest,
  NetlifyEvent,
  NetlifyResponse,
  WritingAnswerInput,
  WritingTemplateSnapshot,
  WritingVisibility,
} from '../types';
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  getDataFromEvent,
  getFunctionNameFromEvent,
  handleOptionsRequest,
} from '../utils/server';
import {
  mapWritingPost,
  normalizeTemplateSnapshot,
  WRITING_POST_SELECT,
} from '../utils/writing';

class RequestError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
  }
}

interface ExistingWriting {
  id: string | number;
  user_id: string | number;
  template_id?: string | number | null;
  template_snapshot?: WritingTemplateSnapshot | null | Record<string, unknown>;
}

interface PreparedWriting {
  title: string;
  body: string;
  template_id: string | null;
  template_snapshot: WritingTemplateSnapshot | null;
  visibility: WritingVisibility;
  topic_ids: string[];
  custom_topic_names: string[];
  image_urls: string[];
  is_anonymous: boolean;
}

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod === 'OPTIONS') return handleOptionsRequest();

  try {
    switch (getFunctionNameFromEvent(event)) {
      case 'getAll':
        return await handleGetAll(event);
      case 'getById':
        return await handleGetById(event);
      case 'create':
        return await handleCreate(event);
      case 'update':
        return await handleUpdate(event);
      case 'delete':
        return await handleDelete(event);
      default:
        return createErrorResponse('无效的操作类型');
    }
  } catch (error) {
    if (error instanceof RequestError) {
      return createErrorResponse(error.message, error.statusCode);
    }
    console.error('[writings] request failed');
    return createErrorResponse('服务器内部错误', 500);
  }
}

function parsePositiveInteger(
  value: unknown,
  fallback: number,
  maximum: number
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function parseId(value: unknown, fieldName: string): string {
  const id = String(value || '').trim();
  if (!/^\d+$/.test(id)) throw new RequestError(`${fieldName}无效`);
  return id;
}

function parseTopicIds(value: unknown): string[] {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const normalizedValues = rawValues
    .map((item) => String(item).trim())
    .filter(Boolean);

  if (normalizedValues.some((item) => !/^\d+$/.test(item))) {
    throw new RequestError('话题 ID 无效');
  }

  const ids = Array.from(new Set(normalizedValues));

  if (ids.length > 5) {
    throw new RequestError('最多选择 5 个话题');
  }
  return ids;
}

function normalizeAnswers(value: unknown): WritingAnswerInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      key: String(item.key || '').trim(),
      answer: String(item.answer || '').trim(),
    }))
    .filter((item) => item.key && item.answer.length <= 4000);
}

function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const urls = Array.from(
    new Set(value.map((item) => String(item || '').trim()).filter(Boolean))
  );
  if (urls.length > 3) throw new RequestError('最多上传 3 张图片');

  urls.forEach((value) => {
    try {
      const url = new URL(value);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'raw.githubusercontent.com'
      ) {
        throw new Error('invalid host');
      }
    } catch {
      throw new RequestError('图片地址无效');
    }
  });
  return urls;
}

async function validateTopics(topicIds: string[]): Promise<void> {
  if (topicIds.length === 0) return;

  const { data, error } = await supabase
    .from('writing_topics')
    .select('id')
    .in('id', topicIds)
    .eq('is_active', true);

  if (error || (data || []).length !== topicIds.length) {
    throw new RequestError('包含不存在或已停用的话题');
  }
}

function buildSnapshotFromItems(
  template_name: string,
  version: number,
  items: Array<{ key?: string; prompt?: string }>,
  answers: WritingAnswerInput[]
): WritingTemplateSnapshot {
  const answerMap = new Map(answers.map((item) => [item.key, item.answer]));
  return {
    template_name,
    version,
    items: items
      .map((item) => ({
        key: String(item.key || ''),
        prompt: String(item.prompt || ''),
        answer: answerMap.get(String(item.key || '')) || '',
      }))
      .filter((item) => item.key && item.prompt),
  };
}

async function buildTemplateSnapshot(
  template_id: string | null,
  answers: WritingAnswerInput[],
  existing?: ExistingWriting
): Promise<WritingTemplateSnapshot | null> {
  if (!template_id) return null;

  const existing_snapshot = normalizeTemplateSnapshot(
    existing?.template_snapshot
  );

  if (
    existing?.template_id &&
    String(existing.template_id) === template_id &&
    existing_snapshot
  ) {
    return buildSnapshotFromItems(
      existing_snapshot.template_name,
      existing_snapshot.version,
      existing_snapshot.items,
      answers
    );
  }

  const { data, error } = await supabase
    .from('writing_templates')
    .select('id, name, prompts, version')
    .eq('id', template_id)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new RequestError('模板不存在或已停用');

  return buildSnapshotFromItems(
    data.name,
    Number(data.version) || 1,
    Array.isArray(data.prompts) ? data.prompts : [],
    answers
  );
}

async function prepareWriting(
  payload: CreateWritingRequest,
  existing?: ExistingWriting
): Promise<PreparedWriting> {
  const title = String(payload.title || '').trim();
  const body = String(payload.body || '').trim();
  if (title.length > 80) throw new RequestError('标题不能超过 80 个字');
  if (body.length > 20000) throw new RequestError('正文不能超过 20000 个字');

  const visibility: WritingVisibility =
    payload.visibility === 'public' ? 'public' : 'private';
  const topic_ids = parseTopicIds(payload.topic_ids);
  await validateTopics(topic_ids);

  const template_id = payload.template_id
    ? parseId(payload.template_id, '模板 ID')
    : null;
  const answers = normalizeAnswers(payload.template_answers);
  const template_snapshot = await buildTemplateSnapshot(
    template_id,
    answers,
    existing
  );
  const hasTemplateAnswer = Boolean(
    template_snapshot?.items.some((item) => item.answer.trim())
  );
  const custom_topic_names = extractHashtags(
    title,
    body,
    ...(template_snapshot?.items.map((item) => item.answer) || [])
  );
  if (custom_topic_names.length > 5) {
    throw new RequestError('每篇书写最多添加 5 个自定义 #话题');
  }
  const image_urls = normalizeImageUrls(payload.image_urls);

  if (!body && !hasTemplateAnswer) {
    throw new RequestError('请填写正文或至少一个模板问题');
  }

  return {
    title,
    body,
    template_id,
    template_snapshot,
    visibility,
    topic_ids,
    custom_topic_names,
    image_urls,
    is_anonymous: Boolean(payload.is_anonymous),
  };
}

async function fetchWritingRow(id: string): Promise<any> {
  const { data, error } = await supabase
    .from('writing_posts')
    .select(WRITING_POST_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) throw new RequestError('书写不存在', 404);
  return data;
}

async function handleGetAll(event: NetlifyEvent): Promise<NetlifyResponse> {
  const requestData = getDataFromEvent(event);
  const scope = requestData.scope === 'mine' ? 'mine' : 'all';
  const sort = requestData.sort === 'oldest' ? 'oldest' : 'latest';
  const page = parsePositiveInteger(requestData.page, 1, 100000);
  const page_size = parsePositiveInteger(requestData.page_size, 12, 50);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(requestData.date || ''))
    ? String(requestData.date)
    : '';
  const parsedTimezoneOffset = Number(requestData.timezone_offset);
  const timezoneOffset = Number.isFinite(parsedTimezoneOffset)
    ? Math.max(-840, Math.min(840, parsedTimezoneOffset))
    : 0;
  const currentUser = await getAuthenticatedUser(event);

  if (scope === 'mine' && !currentUser) {
    return createErrorResponse('未授权', 401);
  }

  let filteredPostIds: string[] | null = null;
  if (requestData.topic_ids) {
    const topic_ids = parseTopicIds(requestData.topic_ids);
    const { data: links, error: linksError } = await supabase
      .from('writing_post_topics')
      .select('post_id')
      .in('topic_id', topic_ids);
    if (linksError) return createErrorResponse('筛选话题失败', 500);
    filteredPostIds = Array.from(
      new Set((links || []).map((link) => String(link.post_id)))
    );
    if (filteredPostIds.length === 0) {
      return createSuccessResponse({
        records: [],
        total: 0,
        page,
        page_size,
      });
    }
  }

  let query = supabase
    .from('writing_posts')
    .select(WRITING_POST_SELECT, { count: 'exact' });

  if (scope === 'mine') {
    query = query.eq('user_id', currentUser!.id);
  } else {
    query = query.eq('visibility', 'public').eq('status', 'published');
  }

  if (filteredPostIds) query = query.in('id', filteredPostIds);

  if (date) {
    const [year, month, day] = date.split('-').map(Number);
    const start = new Date(
      Date.UTC(year, month - 1, day) + timezoneOffset * 60 * 1000
    );
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    query = query
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());
  }

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: sort === 'oldest' })
    .range(from, from + page_size - 1);

  if (error) return createErrorResponse('获取书写列表失败', 500);

  return createSuccessResponse({
    records: (data || []).map((row) =>
      mapWritingPost(row, currentUser?.id || null)
    ),
    total: count || 0,
    page,
    page_size,
  });
}

async function handleGetById(event: NetlifyEvent): Promise<NetlifyResponse> {
  const id = parseId(getDataFromEvent(event).id, '书写 ID');
  const currentUser = await getAuthenticatedUser(event);
  const row = await fetchWritingRow(id);
  const isOwner = currentUser && String(row.user_id) === currentUser.id;

  if (!isOwner && (row.visibility !== 'public' || row.status !== 'published')) {
    throw new RequestError('书写不存在', 404);
  }

  return createSuccessResponse({
    post: mapWritingPost(row, currentUser?.id || null),
  });
}

async function handleCreate(event: NetlifyEvent): Promise<NetlifyResponse> {
  const currentUser = await getAuthenticatedUser(event);
  if (!currentUser) return createErrorResponse('未授权', 401);

  const writing = await prepareWriting(
    getDataFromEvent(event) as CreateWritingRequest
  );
  const { data: postId, error } = await supabase.rpc('create_writing_post_v2', {
    p_user_id: Number(currentUser.id),
    p_title: writing.title,
    p_body: writing.body,
    p_template_id: writing.template_id ? Number(writing.template_id) : null,
    p_template_snapshot: writing.template_snapshot,
    p_visibility: writing.visibility,
    p_topic_ids: writing.topic_ids.map(Number),
    p_custom_topic_names: writing.custom_topic_names,
    p_image_urls: writing.image_urls,
  });

  if (error || !postId) throw new RequestError('发布书写失败', 500);
  const { error: anonymousError } = await supabase
    .from('writing_posts')
    .update({ is_anonymous: writing.is_anonymous })
    .eq('id', postId)
    .eq('user_id', currentUser.id);
  if (anonymousError) {
    await supabase
      .from('writing_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', currentUser.id);
    throw new RequestError('设置匿名状态失败', 500);
  }
  const row = await fetchWritingRow(String(postId));
  return createSuccessResponse(
    { post: mapWritingPost(row, currentUser.id) },
    201
  );
}

async function handleUpdate(event: NetlifyEvent): Promise<NetlifyResponse> {
  const currentUser = await getAuthenticatedUser(event);
  if (!currentUser) return createErrorResponse('未授权', 401);

  const payload = getDataFromEvent(event);
  const id = parseId(payload.id, '书写 ID');
  const { data: existing, error: existingError } = await supabase
    .from('writing_posts')
    .select('id, user_id, template_id, template_snapshot')
    .eq('id', id)
    .single();

  if (existingError || !existing) throw new RequestError('书写不存在', 404);
  if (String(existing.user_id) !== currentUser.id) {
    throw new RequestError('没有权限修改此书写', 403);
  }

  const writing = await prepareWriting(
    payload as CreateWritingRequest,
    existing
  );
  const { data: updated, error } = await supabase.rpc(
    'update_writing_post_v2',
    {
      p_post_id: Number(id),
      p_user_id: Number(currentUser.id),
      p_title: writing.title,
      p_body: writing.body,
      p_template_id: writing.template_id ? Number(writing.template_id) : null,
      p_template_snapshot: writing.template_snapshot,
      p_visibility: writing.visibility,
      p_topic_ids: writing.topic_ids.map(Number),
      p_custom_topic_names: writing.custom_topic_names,
      p_image_urls: writing.image_urls,
    }
  );

  if (error || !updated) throw new RequestError('更新书写失败', 500);
  const { error: anonymousError } = await supabase
    .from('writing_posts')
    .update({ is_anonymous: writing.is_anonymous })
    .eq('id', id)
    .eq('user_id', currentUser.id);
  if (anonymousError) throw new RequestError('设置匿名状态失败', 500);
  const row = await fetchWritingRow(id);
  return createSuccessResponse({ post: mapWritingPost(row, currentUser.id) });
}

async function handleDelete(event: NetlifyEvent): Promise<NetlifyResponse> {
  const currentUser = await getAuthenticatedUser(event);
  if (!currentUser) return createErrorResponse('未授权', 401);

  const id = parseId(getDataFromEvent(event).id, '书写 ID');
  const { data: existing, error: existingError } = await supabase
    .from('writing_posts')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (existingError || !existing) throw new RequestError('书写不存在', 404);
  if (String(existing.user_id) !== currentUser.id) {
    throw new RequestError('没有权限删除此书写', 403);
  }

  const { error } = await supabase
    .from('writing_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);
  if (error) throw new RequestError('删除书写失败', 500);

  return createSuccessResponse({ id });
}
