import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
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
    // const request = ctx.getRequest();
    console.log(exception);
    let status;
    let message;
    let errorCode;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (typeof exception.getResponse() === 'object') {
        errorCode = (exception.getResponse() as CustomError).errorCode;
      }
      if (process.env.NODE_ENV == 'production') {
        message = 'INTERNAL_SERVER_ERROR';
      } else {
        message = exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      if (process.env.NODE_ENV == 'production') {
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
