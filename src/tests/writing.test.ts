import { describe, expect, it } from 'vitest';
import { mapWritingPost, mapWritingTemplate } from '../netlify/utils/writing';
import { extractHashtags, tokenizeHashtags } from '../utils/hashtags';

describe('writing mappers', () => {
  it('maps a database row to a safe frontend DTO', () => {
    const post = mapWritingPost(
      {
        id: 12,
        user_id: 7,
        title: null,
        body: '今天我注意到自己在着急。',
        image_urls: [
          'https://raw.githubusercontent.com/demo/repo/main/image.jpg',
        ],
        template_id: 2,
        template_snapshot: {
          templateName: '情绪观察',
          version: 1,
          items: [
            { key: 'emotion', prompt: '我产生了什么情绪？', answer: '焦虑' },
          ],
        },
        visibility: 'private',
        status: 'published',
        created_at: '2026-07-16T10:00:00.000Z',
        updated_at: '2026-07-16T10:00:00.000Z',
        author: { id: 7, name: '小星', username: 'star' },
        topic_links: [
          {
            topic: {
              id: 2,
              name: '情绪觉察',
              slug: 'emotional-awareness',
              sort_order: 20,
              is_user_created: true,
            },
          },
          {
            topic: {
              id: 1,
              name: '自我评价',
              slug: 'self-evaluation',
              sort_order: 10,
            },
          },
        ],
      },
      '7'
    );

    expect(post.id).toBe('12');
    expect(post.author).toEqual({ id: '7', name: '小星', username: 'star' });
    expect(post.can_edit).toBe(true);
    expect(post.visibility).toBe('private');
    expect(post.image_urls).toHaveLength(1);
    expect(post.topics.map((topic) => topic.name)).toEqual([
      '自我评价',
      '情绪觉察',
    ]);
    expect(post.topics[1].is_user_created).toBe(true);
  });

  it('normalizes template prompt metadata', () => {
    const template = mapWritingTemplate({
      id: 3,
      name: '事件观察',
      slug: 'event-observation',
      prompts: [
        {
          key: 'event',
          prompt: '发生了什么？',
          placeholder: '描述事实',
          required: false,
        },
      ],
      version: 2,
      sort_order: 10,
    });

    expect(template.id).toBe('3');
    expect(template.version).toBe(2);
    expect(template.prompts[0]).toEqual({
      key: 'event',
      prompt: '发生了什么？',
      placeholder: '描述事实',
      required: false,
    });
  });

  it('extracts and tokenizes unique hashtags', () => {
    expect(
      extractHashtags('今天在练习 #情绪觉察，也看见了 #边界感', '#情绪觉察')
    ).toEqual(['情绪觉察', '边界感']);

    expect(
      tokenizeHashtags('记录 #新的话题').map((token) => token.isHashtag)
    ).toEqual([false, true]);
  });
});
