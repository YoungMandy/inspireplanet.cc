import { supabase } from '../../database/supabase';
import { NetlifyEvent, NetlifyResponse } from '../types';
import {
  createErrorResponse,
  createSuccessResponse,
  getFunctionNameFromEvent,
  handleOptionsRequest,
} from '../utils/server';
import { mapWritingTopic } from '../utils/writing';

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod === 'OPTIONS') return handleOptionsRequest();

  if (getFunctionNameFromEvent(event) !== 'getAll') {
    return createErrorResponse('无效的操作类型');
  }

  const { data, error } = await supabase
    .from('writing_topics')
    .select('id, name, slug, description, sort_order, is_user_created')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) return createErrorResponse('获取书写话题失败', 500);

  return createSuccessResponse({ topics: (data || []).map(mapWritingTopic) });
}
