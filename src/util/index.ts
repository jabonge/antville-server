import ogs, { Options, SuccessResult } from 'open-graph-scraper';
export function findCacheTags(str: string) {
  const cacheTagRegex = /\$([a-zA-Z가-힣]{2,})/g;
  const matches = [];
  let match;
  while ((match = cacheTagRegex.exec(str))) {
    matches.push((match[0] as string).substr(1));
  }
  return matches;
}

export function findLinks(str: string) {
  const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  return str.match(urlRegex);
}

async function getOgTags(link: string) {
  const options: Options = {
    url: link,
    onlyGetOpenGraphInfo: true,
    ogImageFallback: false,
  };
  const ogTag = await ogs(options);
  console.log(ogTag);
  if (ogTag.error) {
    return null;
  }
  return (ogTag as SuccessResult).result;
}

const postBody =
  '$TSLA$AMZN$MSFT$SNAP Starting the 1k to 10k this week. Come follow along. Link in profile location!!!https://naver.com';

async function parsePostBody(body: string) {
  const tags = findCacheTags(body);
  const links = findLinks(body);
  let res;
  if (links?.length > 0) {
    const ogTag = await getOgTags(links[0]);
    res = {
      tags,
      link: ogTag,
    };
  } else {
    res = {
      tags,
    };
  }

  console.log(res);
  return;
}

parsePostBody(postBody);
