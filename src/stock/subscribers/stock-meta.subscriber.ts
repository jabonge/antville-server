import { PubSub } from 'graphql-subscriptions';
import {
  PUB_SUB,
  CHANGE_STOCK_META,
} from '../../common/constants/pubsub.constants';
import { StockMeta } from '../entities/stock-meta.entity';
import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
@EventSubscriber()
export class StockMetaSubscriber
  implements EntitySubscriberInterface<StockMeta> {
  constructor(
    private readonly connection: Connection,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return StockMeta;
  }

  afterUpdate(event: UpdateEvent<StockMeta>) {
    this.pubsub.publish(CHANGE_STOCK_META, event.entity);
  }
}
