import { Stock } from './../entities/stock.entity';
import { CommonResponse } from './../../common/dtos/common-response.dto';
import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GetStockResponse extends CommonResponse(Stock) {}
