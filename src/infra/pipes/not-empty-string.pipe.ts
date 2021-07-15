import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { isEmpty } from 'class-validator';

@Injectable()
export class NotEmptyStringPipe implements PipeTransform<string, string> {
  transform(value: string, _: ArgumentMetadata): string {
    if (isEmpty(value)) {
      throw new BadRequestException('Invalid Param or Query');
    }
    return value;
  }
}
