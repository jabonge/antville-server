export function getEnvFilePath() {
  const env = process.env.NODE_ENV;
  if (env === 'production') {
    return '/.env.production';
  } else if (env === 'development') {
    return '/.env.dev';
  } else {
    return '/.env.local';
  }
}
