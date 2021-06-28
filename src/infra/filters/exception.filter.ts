import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import CustomError from '../../util/constant/exception';

interface CustomError {
  errorCode?: number;
  message: string;
}

@Catch()
export class AVExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const env = process.env.NODE_ENV;

    let status;
    let message;
    let errorCode;

    if (env === 'local') {
      Logger.error(exception);
    }

    if (exception instanceof HttpException) {
      const errResponse = exception.getResponse();
      status = exception.getStatus();

      if (typeof exception.getResponse() === 'object') {
        errorCode = (errResponse as CustomError).errorCode;
        message = (errResponse as CustomError).message.toString();
      }
      if (env === 'production' && status > 499) {
        message = 'INTERNAL_SERVER_ERROR';
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
