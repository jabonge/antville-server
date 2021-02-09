import axios from 'axios';

const client = axios.create({
  baseURL: 'http://asp1.krx.co.kr/servlet/krx.asp.XMLSise',
});

export default client;
