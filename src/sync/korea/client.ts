import axios from 'axios';

const client = axios.create({
  baseURL: 'https://sandbox-apigw.koscom.co.kr/v2/market',
});

client.interceptors.request.use((config) => {
  config.params = {
    ...(config.params || {}),
    apikey: process.env.KOSCOM_API_KEY,
  };
  return config;
});

export default client;
