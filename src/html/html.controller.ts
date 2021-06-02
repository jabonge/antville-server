import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { HtmlService } from './html.service';

@Controller('html')
export class HtmlController {
  constructor(private readonly htmlService: HtmlService) {}

  @Get('password')
  async getPasswordHtml(@Res() res: Response, @Query('token') token: string) {
    const { tempPassword, viewName } = await this.htmlService.findTempPassword(
      token,
    );
    res.setHeader(
      'Content-Security-Policy',
      "img-src 'self' https://antville-test.s3.ap-northeast-2.amazonaws.com",
    );
    return res.render(viewName, { tempPassword });
  }

  @Get('verify')
  async verifyEmail(@Res() res: Response, @Query('token') token: string) {
    const { viewName } = await this.htmlService.verifyEmail(token);
    res.setHeader(
      'Content-Security-Policy',
      "img-src 'self' https://antville-test.s3.ap-northeast-2.amazonaws.com",
    );
    return res.render(viewName);
  }
}
