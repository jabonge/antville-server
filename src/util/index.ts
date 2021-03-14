export function findHashTags(str: string) {
  const regex = /\$([a-zA-Z가-힣]{2,})/g;
  const matches = [];
  let match;
  while ((match = regex.exec(str))) {
    matches.push(match[0]);
  }
  return matches;
}
