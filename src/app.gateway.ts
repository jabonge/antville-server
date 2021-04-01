import { NEW_POST, PUB_SUB } from './common/constants/pubsub.constants';
import { StockPriceInfoDto } from './domain/stock/dtos/stock_price_info.dto';
import { JwtPayload } from './domain/auth/auth.interface';
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
import { CHANGE_STOCK_PRICE_INFO } from './common/constants/pubsub.constants';
import WebSocket, { Server } from 'ws';
import { IncomingMessage } from 'node:http';
import { Post } from './domain/post/entities/post.entity';
import { PubSub } from './common/interfaces/pub_sub.interface';

@WebSocketGateway(4000)
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
        this.connectedClients.forEach(({ ws, stockId }) => {
          if (
            stockId &&
            ws.readyState === WebSocket.OPEN &&
            post.postToStocks?.map((s) => s.stockId)?.includes(stockId)
          ) {
            ws.send(message);
          }
        });
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
        console.log(e);
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
    console.log(data);
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
    console.log(data);
    const clientInMap = this.connectedClients.get(data.id);
    if (clientInMap) {
      this.connectedClients.get(data.id).stockId = data.stockId;
    } else {
      client.close(1011, 'Unauthorized');
    }
  }
}
