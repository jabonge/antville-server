import ogs, {
  OpenGraphImage,
  Options,
  SuccessResult,
} from 'open-graph-scraper';

export function findCacheTags(str: string): string[] {
  const cacheTagRegex = /\$([a-zA-Z가-힣]{2,})/g;
  const matches = [];
  let match;
  while ((match = cacheTagRegex.exec(str))) {
    matches.push((match[0] as string).substr(1));
  }
  return Array.from(new Set(matches));
}

// export function removeMultiLine(str: string): string[] {
//   const carrigeReturnRegex = /\n/g;
//   const matches = [];
//   let match;
//   while ((match = carrigeReturnRegex.exec(str))) {

//   }
//   return matches;
// }

export function findAtSignNickname(str: string): string[] {
  const atSignRegex = /@([a-zA-Z가-힣_.]{2,})/g;
  const matches = [];
  let match;
  while ((match = atSignRegex.exec(str))) {
    matches.push((match[0] as string).substr(1));
  }
  return Array.from(new Set(matches));
}

export async function getOgTags(link: string) {
  const options: Options = {
    url: link,
    onlyGetOpenGraphInfo: true,
    ogImageFallback: false,
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
    },
  };
  try {
    const ogTag = await ogs(options);
    if (ogTag.error) {
      return null;
    }
    const result = (ogTag as SuccessResult).result;
    let ogImage: string;
    if (typeof result.ogImage === 'string') {
      ogImage = result.ogImage;
    } else if (typeof result.ogImage === 'object') {
      ogImage = (result.ogImage as OpenGraphImage).url;
    } else if (Array.isArray(result.ogImage)) {
      ogImage = (result.ogImage as OpenGraphImage[])[0].url;
    }
    return {
      ogSiteName: result.ogSiteName,
      ogImage: ogImage,
      ogTitle: result.ogTitle,
      ogDescription: result.ogDescription,
      ogUrl: result.ogUrl ?? link,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
}

export function findLinks(str: string): string | null {
  const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  const list = str.match(urlRegex);
  if (list) {
    return list[0];
  }
  return null;
}
