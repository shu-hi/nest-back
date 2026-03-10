import { Controller, Get,Post,Param, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AppService } from './services/app.service';
import type { Express } from 'express';
import { ShowHolo } from './services/holoClass';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'uppic', maxCount: 1 },
      { name: 'rightpic', maxCount: 1 },
      { name: 'downpic', maxCount: 1 },
      { name: 'leftpic', maxCount: 1 },
    ], {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: {
      video?: Express.Multer.File[];
      uppic?: Express.Multer.File[];
      rightpic?: Express.Multer.File[];
      downpic?: Express.Multer.File[];
      leftpic?: Express.Multer.File[];
    },
  ):Promise<{hash:string,url:string}>{
    return this.appService.getupload(files);
  }
  @Get('show/:hash')
  async getShow(@Param('hash') hash:string):Promise<{media_type:number,url:string}>{
    return this.appService.showHolo(hash);
  }
}