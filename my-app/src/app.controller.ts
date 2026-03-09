import { Controller, Get,Post,Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './services/app.service';
import type { Express } from 'express';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File):string{
    return this.appService.getupload();
  }
  @Post('show/:hash')
  getShow(@Param('hash') hash:string):string{
    return hash;
  }
}
