import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IncomingWebhook } from '@slack/webhook';
import { InjectSlack } from 'nestjs-slack-webhook';

@Injectable()
export class WebhookInterceptor implements NestInterceptor {
  constructor(
    @InjectSlack()
    private readonly slack: IncomingWebhook,
  ) {}
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    if (process.env.NODE_ENV === 'local') return next.handle();
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof HttpException) {
          if (error.getStatus() > 499) {
            this.slack.send({
              attachments: [
                {
                  color: 'danger',
                  fields: [
                    {
                      title: error.message,
                      value: error.stack,
                      short: false,
                    },
                  ],
                  ts: Math.floor(new Date().getTime() / 1000).toString(),
                },
              ],
            });
          }
        }
        return throwError(error);
      }),
    );
  }
}
