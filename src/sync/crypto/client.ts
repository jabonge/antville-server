import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.upbit.com/v1',
});

export default client;
