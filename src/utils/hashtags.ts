export interface HashtagToken {
  text: string;
  isHashtag: boolean;
}

const HASHTAG_PATTERN = /#[\p{L}\p{N}_-]{1,20}/gu;

export function extractHashtags(...values: string[]): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    for (const match of String(value || '').matchAll(HASHTAG_PATTERN)) {
      const name = match[0].slice(1);
      const normalized = name.toLocaleLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        tags.push(name);
      }
    }
  });

  return tags;
}

export function tokenizeHashtags(value: string): HashtagToken[] {
  const text = String(value || '');
  const tokens: HashtagToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(HASHTAG_PATTERN)) {
    const index = match.index || 0;
    if (index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, index), isHashtag: false });
    }
    tokens.push({ text: match[0], isHashtag: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), isHashtag: false });
  }

  return tokens.length ? tokens : [{ text, isHashtag: false }];
}
