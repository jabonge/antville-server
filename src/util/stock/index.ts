export function isKoreanLang(value: string) {
  const koRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
  return koRegex.test(value);
}
