export interface DynamicTag {
  tag: string;
  label: string;
  group: string;
  returns: 'text' | 'url' | 'html';
}

export const DYNAMIC_TAGS: DynamicTag[] = [
  { tag: 'post_title', label: 'Post Title', group: 'Post', returns: 'text' },
  { tag: 'post_content', label: 'Post Content', group: 'Post', returns: 'html' },
  { tag: 'post_excerpt', label: 'Excerpt', group: 'Post', returns: 'text' },
  { tag: 'post_date', label: 'Publish Date', group: 'Post', returns: 'text' },
  { tag: 'post_author', label: 'Author', group: 'Post', returns: 'text' },
  { tag: 'featured_image', label: 'Featured Image', group: 'Post', returns: 'url' },
  { tag: 'post_category', label: 'Category', group: 'Post', returns: 'text' },
  { tag: 'post_tags', label: 'Tags', group: 'Post', returns: 'text' },
  { tag: 'site_title', label: 'Site Title', group: 'Site', returns: 'text' },
  { tag: 'site_url', label: 'Site URL', group: 'Site', returns: 'url' },
];

const TAG_REGEX = /\{\{([a-z_]+)(?::([^}]*))?\}\}/g;

export function hasDynamicTag(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /\{\{[a-z_]/.test(value);
}

export function resolveDynamicTags(value: string, postData: Record<string, string>): string {
  return value.replace(TAG_REGEX, (_, tag, param) => {
    if (tag === 'custom_field' && param) {
      return postData[`cf_${param}`] ?? `{{custom_field:${param}}}`;
    }
    return postData[tag] ?? `{{${tag}}}`;
  });
}

export function insertTag(currentValue: string, tag: string): string {
  return currentValue + `{{${tag}}}`;
}

export function getTagsForProp(propType: 'text' | 'url' | 'html'): DynamicTag[] {
  if (propType === 'url') return DYNAMIC_TAGS.filter((t) => t.returns === 'url');
  return DYNAMIC_TAGS;
}
