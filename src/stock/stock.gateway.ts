import { PUB_SUB } from './../common/constants/pubsub.constants';
import { StockMetaResponseDto } from './dtos/stock-meta-response.dto';
import { JwtPayload } from './../auth/auth.interface';
import { JwtService } from '@nestjs/jwt';
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
import { IncomingMessage } from 'node:http';
import qs from 'qs';

@WebSocketGateway(4000)
export class StockGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<
    number,
    { ws: WebSocket; symbols?: string[] }
  > = new Map();

  constructor(
    @Inject(PUB_SUB) private readonly subscriber: RedisClient,
    private readonly jwtService: JwtService,
  ) {
    subscriber.subscribe(CHANGE_STOCK_META);
    subscriber.on('message', (channel, message) => {
      if (channel === CHANGE_STOCK_META) {
        const stockMeta = JSON.parse(message) as StockMetaResponseDto;
        this.connectedClients.forEach(({ ws, symbols }) => {
          if (
            ws.readyState === WebSocket.OPEN &&
            symbols?.includes(stockMeta.symbol)
          ) {
            ws.send(message);
          }
        });
      }
    });
  }

  handleConnection(client: WebSocket, req: IncomingMessage) {
    if (req.url) {
      try {
        const token = qs.parse(req.url.substring(1)).token as string;
        const userId = this.jwtService.verify<JwtPayload>(token)?.id;
        this.connectedClients.set(userId, { ws: client });
        client.on('close', () => {
          this.connectedClients.delete(userId);
        });
      } catch (e) {
        console.log(e);
        client.close(1011, 'Unauthorized');
      }
    }
  }

  @SubscribeMessage(CHANGE_STOCK_META)
  handleEvent(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { id: number; symbols: string[] },
  ) {
    console.log(data);
    const clientInMap = this.connectedClients.get(data.id);
    if (clientInMap) {
      this.connectedClients.get(data.id).symbols = data.symbols;
    } else {
      client.close(1011, 'Unauthorized');
    }
  }
}
