import { Injectable } from '@nestjs/common';

import {HoloFactory,getMediaByHash,ShowHolo,VideoStrategy,PicStrategy} from './holoClass'
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  async getupload(files):Promise<{hash:string,url:string}>{
    const holoclass=await HoloFactory.create(files);
    const retObject=await holoclass.store();
    return retObject;
  }
  //strategy pattern用　何もやってない
  async showHolo(hash:string):Promise<{media_type:number,url:string}>{
    const {url,media_type}=await getMediaByHash(hash);
    const showClass=new ShowHolo(url,hash);
    switch(media_type){
      case 1:
        showClass.setStrategy(new PicStrategy());
        break;
      case 2:
        showClass.setStrategy(new VideoStrategy());
        break;
      default:
        showClass.setStrategy(new VideoStrategy());
        break;
    }
    return showClass.showMedia();
  }
}
