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

const validId = (value: unknown) =>
  /^\d+$/.test(String(value || '')) ? String(value) : null;

async function canViewPost(postId: string, userId?: string) {
  const { data } = await supabase
    .from('writing_posts')
    .select('user_id, visibility, status')
    .eq('id', postId)
    .single();
  return Boolean(
    data &&
    (String(data.user_id) === userId ||
      (data.visibility === 'public' && data.status === 'published'))
  );
}

function mapComment(row: any, userId?: string, isAdmin = false) {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: String(row.id),
    post_id: String(row.post_id),
    user_id: String(row.user_id),
    parent_id: row.parent_id ? String(row.parent_id) : null,
    content: row.content || '',
    created_at: row.created_at,
    author: {
      id: String(author?.id || row.user_id),
      name: author?.name || author?.username || '匿名用户',
      username: author?.username || null,
    },
    can_delete: String(row.user_id) === userId || isAdmin,
  };
}

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod === 'OPTIONS') return handleOptionsRequest();
  const action = getFunctionNameFromEvent(event);
  const input = getDataFromEvent(event);
  const user = await getAuthenticatedUser(event);

  if (action === 'get') {
    const postId = validId(input.post_id);
    if (!postId || !(await canViewPost(postId, user?.id)))
      return createErrorResponse('书写不存在', 404);
    const [{ data: comments, error }, { count }, { data: mine }] =
      await Promise.all([
        supabase
          .from('writing_comments')
          .select(
            'id, post_id, user_id, parent_id, content, created_at, author:users!writing_comments_user_id_fkey(id, name, username)'
          )
          .eq('post_id', postId)
          .eq('status', 'published')
          .order('created_at'),
        supabase
          .from('writing_resonances')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId),
        user
          ? supabase
              .from('writing_resonances')
              .select('id')
              .eq('post_id', postId)
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
    if (error) return createErrorResponse('获取互动失败', 500);
    return createSuccessResponse({
      resonance_count: count || 0,
      has_resonated: Boolean(mine),
      comments: (comments || []).map((row) =>
        mapComment(row, user?.id, user?.role === 'organizer')
      ),
    });
  }

  if (!user) return createErrorResponse('未授权', 401);
  if (action === 'toggleResonance') {
    const postId = validId(input.post_id);
    if (!postId || !(await canViewPost(postId, user.id)))
      return createErrorResponse('书写不存在', 404);
    const { data: existing } = await supabase
      .from('writing_resonances')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();
    const result = existing
      ? await supabase.from('writing_resonances').delete().eq('id', existing.id)
      : await supabase
          .from('writing_resonances')
          .insert({ post_id: postId, user_id: user.id });
    if (result.error) return createErrorResponse('操作失败', 500);
    const { count } = await supabase
      .from('writing_resonances')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);
    return createSuccessResponse({
      resonance_count: count || 0,
      has_resonated: !existing,
    });
  }
  if (action === 'addComment') {
    const postId = validId(input.post_id);
    const parentId = input.parent_id ? validId(input.parent_id) : null;
    const content = String(input.content || '').trim();
    if (!postId || !(await canViewPost(postId, user.id)))
      return createErrorResponse('书写不存在', 404);
    if (!content || content.length > 500)
      return createErrorResponse('评论需为 1-500 个字');
    if (input.parent_id && !parentId)
      return createErrorResponse('回复的评论 ID 无效');
    if (parentId) {
      const { data: parent } = await supabase
        .from('writing_comments')
        .select('id')
        .eq('id', parentId)
        .eq('post_id', postId)
        .eq('status', 'published')
        .maybeSingle();
      if (!parent) return createErrorResponse('要回复的评论不存在', 404);
    }
    const { data, error } = await supabase
      .from('writing_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        parent_id: parentId,
        content,
      })
      .select('id, post_id, user_id, parent_id, content, created_at')
      .single();
    if (error || !data) return createErrorResponse('评论失败', 500);
    return createSuccessResponse(
      { comment: mapComment({ ...data, author: user }, user.id) },
      201
    );
  }
  if (action === 'deleteComment') {
    const id = validId(input.id);
    if (!id) return createErrorResponse('评论 ID 无效');
    let query = supabase.from('writing_comments').delete().eq('id', id);
    if (user.role !== 'organizer') query = query.eq('user_id', user.id);
    const { error, count } = await query.select('id', { count: 'exact' });
    if (error) return createErrorResponse('删除评论失败', 500);
    if (!count) return createErrorResponse('评论不存在或无权删除', 404);
    return createSuccessResponse({ id });
  }
  return createErrorResponse('无效的操作类型');
}
