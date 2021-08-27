import { StockPriceInfoDto } from './domain/stock/dtos/stock_price_info.dto';
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
import { isUUID } from 'class-validator';

@WebSocketGateway()
@UseGuards(WsThrottlerGuard)
export class AppGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  //HashMap 사용고려
  private connectedClients: Map<
    string,
    { ws: WebSocket; symbols: string[]; detailSymbols: string[] }
  > = new Map();

  constructor(@Inject(PUB_SUB) private readonly pubsub: PubSub) {
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
        this.connectedClients.forEach(({ ws, symbols, detailSymbols }) => {
          const symbolList = Array.from(
            new Set([...symbols, ...detailSymbols]),
          );
          if (
            ws.readyState === WebSocket.OPEN &&
            symbolList.includes(stockPriceInfo.symbol)
          ) {
            ws.send(message);
          }
        });
      } else if (channel === NEW_POST) {
        const post = JSON.parse(message) as Post;
        const symbols = post.stockPosts?.map((s) => s.symbol);
        if (symbols) {
          delete post.stockPosts;
          this.connectedClients.forEach(({ ws, detailSymbols }) => {
            const lastSymbol = detailSymbols[detailSymbols.length - 1];
            if (
              lastSymbol &&
              ws.readyState === WebSocket.OPEN &&
              symbols.includes(lastSymbol)
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
    let id;
    if (client.protocol) {
      id = client.protocol;
    } else if (req.headers.id) {
      id = req.headers.id as string;
    }
    if (!isUUID(id, 4)) {
      client.close(1011, 'Unauthorized');
      return;
    }
    this.connectedClients.set(id, {
      ws: client,
      symbols: [],
      detailSymbols: [],
    });
    client.on('close', () => {
      this.connectedClients.delete(id);
    });
  }

  //Symbols Alphabet순 -> 최적화?
  @SubscribeMessage(CHANGE_STOCK_PRICE_INFO)
  handleChangeStockMeta(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { id: string; symbols: string[] },
  ) {
    const clientInMap = this.connectedClients.get(data.id);
    if (clientInMap) {
      if (data.symbols.length > 40) {
        client.close();
      }
      this.connectedClients.get(data.id).symbols = data.symbols;
    } else {
      client.close(1011, 'Unauthorized');
    }
  }

  @SubscribeMessage(NEW_POST)
  handleNewPost(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { id: string; symbols: string[] },
  ) {
    const clientInMap = this.connectedClients.get(data.id);
    if (clientInMap) {
      this.connectedClients.get(data.id).detailSymbols =
        data.symbols.length > 3 ? data.symbols.slice(-3) : data.symbols;
    } else {
      client.close(1011, 'Unauthorized');
    }
  }
}
