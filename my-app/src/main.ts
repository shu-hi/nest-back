import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS を有効にする
  app.enableCors({
    origin: 'http://localhost:4000', // フロントエンドの URL を指定
    methods: 'GET,POST,PUT,DELETE',  // 許可する HTTP メソッドを指定
    allowedHeaders: 'Content-Type, Authorization', // 許可するヘッダーを指定
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
