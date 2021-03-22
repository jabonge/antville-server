import { RedisClient } from 'redis';

export interface PubSub {
  publisher: RedisClient;
  subscriber: RedisClient;
}
