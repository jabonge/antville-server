import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { CHANGE_STOCK_META } from '../common/constants/pubsub.constants';
import { RedisClient } from 'redis';
import WebSocket, { Server } from 'ws';

@WebSocketGateway(4000)
export class StockGateway implements OnGatewayConnection {
  constructor(@Inject('REDIS_SUB') private readonly subscriber: RedisClient) {
    subscriber.subscribe(CHANGE_STOCK_META);
    subscriber.on('message', (channel, message) => {
      if (channel === CHANGE_STOCK_META) {
        console.log(message);
      }
    });
  }

  handleConnection(client: WebSocket) {
    console.log('hi Connect');
    console.log(client);
  }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage(CHANGE_STOCK_META)
  handleEvent(@ConnectedSocket() client: WebSocket, @MessageBody() data) {
    console.log(data);
  }
}
