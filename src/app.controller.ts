import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from '@/app.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiExcludeEndpoint()
  @Get('docs/login')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getDocsLoginPage(): string {
    return this.appService.getDocsLoginHtml();
  }

  @ApiExcludeEndpoint()
  @Get('docs/logout')
  docsLogout(@Res() res: Response): void {
    this.appService.clearDocsCookie(res);
    res.redirect('/api/docs/login');
  }
}
