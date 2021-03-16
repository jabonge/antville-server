import ogs, { Options, SuccessResult } from 'open-graph-scraper';

export function findCacheTags(str: string): string[] {
  const cacheTagRegex = /\$([a-zA-Z가-힣]{2,})/g;
  const matches = [];
  let match;
  while ((match = cacheTagRegex.exec(str))) {
    matches.push((match[0] as string).substr(1));
  }
  return matches;
}

export async function getOgTags(link: string) {
  const options: Options = {
    url: link,
    onlyGetOpenGraphInfo: true,
    ogImageFallback: false,
  };
  const ogTag = await ogs(options);
  if (ogTag.error) {
    return null;
  }
  return (ogTag as SuccessResult).result;
}

export function findLinks(str: string): string | null {
  const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  const list = str.match(urlRegex);
  if (list) {
    return list[0];
  }
  return null;
}
