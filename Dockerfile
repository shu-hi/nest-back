FROM node:22-slim 

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# 必要なパッケージをインストール（tzdata、tini、curl）
RUN apt-get update && apt-get -qq install -y --no-install-recommends \
    tzdata \
    tini \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 環境変数NODE_ENVをproductionに設定
ENV NODE_ENV production

# package.jsonとpackage-lock.jsonをコピー
COPY --chown=node:node ./my-app/package*.json ./

# 依存関係をインストール（npm ciでクリーンインストール）
RUN npm ci
RUN npm install --save-dev @nestjs/cli
# 追加の依存関係をインストール（必要なパッケージを追加）
RUN npm i -D @types/multer
RUN npm install @supabase/supabase-js
RUN npm install sharp
RUN npm install @nestjs/config

# アプリケーションのソースコードをコピー
COPY --chown=node:node ./my-app ./

# TypeScriptコードをコンパイル（NestJSビルドコマンド）
RUN npm run build

# nodeユーザーとして実行
USER node

# tiniを使用してPID 1問題に対処
ENTRYPOINT ["/usr/bin/tini", "--"]

# アプリケーションを開始
CMD ["npm", "start"]
