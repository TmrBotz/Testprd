export function slugify(input) {
  return String(input === null || input === undefined ? '' : input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function isValidSlug(slug) {
  return (
    typeof slug === 'string' &&
    slug.length > 0 &&
    slug.length <= 80 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  );
}
