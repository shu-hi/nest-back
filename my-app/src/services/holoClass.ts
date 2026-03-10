//Bridgeパターン
//Mementoパターン
//Commandパターン
//Compositeパターン
//Observerパターン
//Proxyパターン
//Adapterパターン
import { createClient } from '@supabase/supabase-js';
import { BadRequestException,InternalServerErrorException,NotFoundException } from '@nestjs/common';
import { extname } from 'path';
import sharp from 'sharp';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { url } from 'inspector';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
//メディア格納側------------------------------------------------------------------------------------------
export abstract class AbstractHoloClass {
  abstract store(): Promise<{ hash: string, url: string }>;
}

// Simple Factory パターン
export class HoloFactory {
  static async create(files): Promise<AbstractHoloClass> {
    if (files.uppic&&files.rightpic&&files.downpic&&files.leftpic) {
      const mediacomponent=new HoloPics(files.uppic[0],files.rightpic[0],files.downpic[0],files.leftpic[0])
      return new PicHoloClass(await mediacomponent.getMedia());
    } else if (files.video) {
      const mediacomponent=new HoloVids(files.video[0])
      return new VidHoloClass(await mediacomponent.getMedia());
    }else{
      throw new BadRequestException("media empty");
    }
  }
}
//----------------------------------------------------------------------------
//composite pattern
interface mediaComponent{
  getMedia():Promise<Express.Multer.File>
}
// holoPics クラス
export class HoloPics implements mediaComponent{
  constructor(
    private readonly _uppic: Express.Multer.File,
    private readonly _rightpic: Express.Multer.File,
    private readonly _downpic: Express.Multer.File,
    private readonly _leftpic: Express.Multer.File
  ) {}

  async getMedia(){
    const width = 500;
    const height = 500;
    const u = await sharp(this._uppic.buffer).resize(width, height).rotate(180).toBuffer();
    const r = await sharp(this._rightpic.buffer).resize(width, height).rotate(90).toBuffer();
    const d = await sharp(this._downpic.buffer).resize(width, height).toBuffer();
    const l = await sharp(this._leftpic.buffer).resize(width, height).rotate(270).toBuffer();
    const buffer = await sharp({
      create: {
        width: width * 3,
        height: height * 3,
        channels: 3,
        background: '#000000', // 黒背景
      },
    }).composite([
        { input: u, top: 0, left: width },
        { input: r, top: height, left: width*2 },
        { input: d, top: height*2, left: 0 },
        { input: l, top: height, left: 0 },
      ])
      .png()
    .toBuffer();

    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'combined.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: buffer.length,
      buffer: buffer,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    return file; 
  }
}
export class HoloVids implements mediaComponent{
  constructor(
    private readonly _video: Express.Multer.File,
  ) {}
  async getMedia(){
    return this._video;
  }
}

// picHoloClass
export class PicHoloClass extends AbstractHoloClass {
  constructor(
    private readonly file:Express.Multer.File) {
    super();
  }

  async store(): Promise<{ hash: string, url: string }> {
    const hash = crypto.randomUUID();
    const path = `${hash}/${this.file.originalname}`;
    const { data, error } = await supabase.storage
      .from("media_storage")
      .upload(path, this.file.buffer, {
        contentType: this.file.mimetype
      });
  
    if (error) {
      throw new InternalServerErrorException(error.message);
    }

  
    const url =`${process.env.SUPABASE_URL}/storage/v1/object/public/media_storage/${path}`;
  
    await this.saveMedia(hash, url);
  
    return { hash, url };
    }
    async saveMedia(hash: string, url: string) {
      await supabase
        .from("holo_media")
        .insert({
          hash,
          url,
          media_type:1,
        });
    }
}

// vidHoloClass
export class VidHoloClass extends AbstractHoloClass {
  constructor(
    private readonly video: Express.Multer.File) {
    super();
  }

  async store(): Promise<{ hash: string, url: string }> {
    const hash = crypto.randomUUID();
    const path = `${hash}/${this.video.originalname}`;
    const { error } = await supabase.storage
      .from('media_storage') // バケット名
      .upload(path, this.video.buffer, {
        contentType: this.video.mimetype,
      });
  
    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  
    const { data } = supabase.storage
    .from("media_storage")
    .getPublicUrl(path);

    const url = data.publicUrl;

  
    await this.saveMedia(hash, url);
  
    return { hash, url };
    }
    async saveMedia(hash: string, url: string) {
      await supabase
        .from("holo_media")
        .insert({
          hash,
          url,
          media_type:2,
        });
  }
}
//表示側------------------------------------------------------------------------------
// Strategy パターン
export interface ShowStrategy {
  show(url: string, hash: string): { url: string; media_type: number };
}
//実際の動画/画像を返す処理についてメディアごとのstrategyを入れる
export class ShowHolo {
  private _url: string = '';
  private _hash:string='';
  private _strategy:ShowStrategy;

  constructor(goturl:string,hash:string) {
    this._url=goturl;
    this._hash=hash;
  }

  setStrategy(strategy: ShowStrategy) {
    this._strategy = strategy;
  }

  showMedia() {
    if (!this._strategy) throw new Error("Strategy not set");
    return this._strategy.show(this._url, this._hash);
  }
}

export class VideoStrategy implements ShowStrategy {
  show(url: string, hash: string) {
    return { url, media_type: 2 }; // 2 = 動画
  }
}

export class PicStrategy implements ShowStrategy {
  show(url: string, hash: string) {
    return { url, media_type: 1 }; // 1 = 画像
  }
}
export async function getMediaByHash(hash: string): Promise<{ url: string, media_type: number }> {
  const { data, error } = await supabase
    .from('holo_media')          // DBテーブル名
    .select('url, media_type')   // 取得するカラム
    .eq('hash', hash)            // hashでフィルター
    .single();                   // 1件だけ取得

  if (error) {
    throw new InternalServerErrorException(error.message);
  }

  if (!data) {
    throw new NotFoundException(`Media not found for hash: ${hash}`);
  }

  return {
    url: data.url,
    media_type: data.media_type,
  };
}
//-----------------------------------------------------------------------------------