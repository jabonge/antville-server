import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface CustomError {
  errorCode?: number;
  message: string;
}

@Catch()
export class VtExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const env = process.env.NODE_ENV;

    if (env === 'local') {
      Logger.error(exception);
    }

    let status;
    let message;
    let errorCode;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (typeof exception.getResponse() === 'object') {
        errorCode = (exception.getResponse() as CustomError).errorCode;
      }
      if (env === 'production') {
        message = 'INTERNAL_SERVER_ERROR';
      } else {
        message = exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      if (env === 'production') {
        message = 'INTERNAL_SERVER_ERROR';
      } else {
        message = exception.toString();
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      errorCode,
    });
  }
}
