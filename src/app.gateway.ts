import { StockPriceInfoDto } from './domain/stock/dtos/stock_price_info.dto';
import { JwtPayload } from './domain/auth/auth.interface';
import { JwtService } from '@nestjs/jwt';
import { Inject, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import WebSocket, { Server } from 'ws';
import { IncomingMessage } from 'node:http';
import { Post } from './domain/post/entities/post.entity';
import {
  CHANGE_STOCK_PRICE_INFO,
  NEW_POST,
  PUB_SUB,
} from './util/constant/redis';
import { PubSub } from './shared/redis/interfaces';
import { WsThrottlerGuard } from './infra/guards/ws-throttler.guard';

@WebSocketGateway()
@UseGuards(WsThrottlerGuard)
export class AppGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  //HashMap 사용고려
  private connectedClients: Map<
    string,
    { ws: WebSocket; symbols?: string[]; stockId?: number }
  > = new Map();

  constructor(
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
    private readonly jwtService: JwtService,
  ) {
    setInterval(() => {
      this.connectedClients.forEach(({ ws }, id) => {
        ws.ping((err) => {
          if (err) {
            this.connectedClients.delete(id);
          }
        });
      });
    }, 20000);
    pubsub.subscriber.subscribe([CHANGE_STOCK_PRICE_INFO, NEW_POST]);
    pubsub.subscriber.on('message', (channel, message) => {
      if (channel === CHANGE_STOCK_PRICE_INFO) {
        const stockPriceInfo = JSON.parse(message) as StockPriceInfoDto;
        this.connectedClients.forEach(({ ws, symbols }) => {
          if (
            ws.readyState === WebSocket.OPEN &&
            symbols?.includes(stockPriceInfo.symbol)
          ) {
            ws.send(message);
          }
        });
      } else if (channel === NEW_POST) {
        const post = JSON.parse(message) as Post;
        const stockIds = post.stockPosts?.map((s) => s.stockId);
        if (stockIds) {
          delete post.stockPosts;
          this.connectedClients.forEach(({ ws, stockId }) => {
            if (
              stockId &&
              ws.readyState === WebSocket.OPEN &&
              stockIds.includes(stockId)
            ) {
              ws.send(message);
            }
          });
        }
      }
    });
  }

  //userId 말고 다른 값으로 클라이언트 구분하기!
  handleConnection(client: WebSocket, req: IncomingMessage) {
    if (req.url) {
      try {
        const id = req.headers.id as string;
        const token = req.headers.token as string;
        this.jwtService.verify<JwtPayload>(token);
        this.connectedClients.set(id, { ws: client });
        client.on('close', () => {
          this.connectedClients.delete(id);
        });
      } catch (e) {
        client.close(1011, 'Unauthorized');
      }
    }
  }

  //Symbols Alphabet순 -> 최적화?
  @SubscribeMessage(CHANGE_STOCK_PRICE_INFO)
  handleChangeStockMeta(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { id: string; symbols?: string[] },
  ) {
    const clientInMap = this.connectedClients.get(data.id);
    if (clientInMap) {
      this.connectedClients.get(data.id).symbols = data.symbols;
    } else {
      client.close(1011, 'Unauthorized');
    }
  }

  @SubscribeMessage(NEW_POST)
  handleNewPost(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { id: string; stockId?: number },
  ) {
    const clientInMap = this.connectedClients.get(data.id);
    if (clientInMap) {
      this.connectedClients.get(data.id).stockId = data.stockId;
    } else {
      client.close(1011, 'Unauthorized');
    }
  }
}
