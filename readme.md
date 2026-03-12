---
marp: true
pagenate: true

---
```mermaid
classDiagram
    class AbstractHoloClass{
        <<abstract>>
        +abstract store() 
    }
    class HoloFactory {
        +async create(files) Promise<AbstractHoloClass>
    }
    class mediaComponent{
        <<interface>>
        +getMedia() Promise<Express.Multer.File>
    }
    class HoloPics{
        +async getMedia() Express.Multer.File
    }
    class HoloVids{
        +async getMedia() Express.Multer.File
    }
    class PicHoloClass{
        +async store() 
    }
    class VidHoloClass{
        +async store() 
    }
    AbstractHoloClass <|-- PicHoloClass : extends
    AbstractHoloClass <|-- VidHoloClass : extends
    mediaComponent <|-- HoloPics : implements
    mediaComponent <|-- HoloVids : implements
```
```mermaid
classDiagram
    class ShowStrategy{
        <<interface>>
        +show(url: string, hash: string) 
    }
    class ShowHolo {
        -_url: string 
        -_hash:string
        -_strategy:ShowStrategy
        +setStrategy(strategy: ShowStrategy) void
        +showMedia() strategy: ShowStrategy
    }
    class VideoStrategy{
        show(url: string, hash: string) 
    }
    class PicStrategy{
        show(url: string, hash: string) 
    }
    ShowStrategy <|-- VideoStrategy : implements
    ShowStrategy <|-- PicStrategy : implements
```

---
holoのバックエンド側。


mediaComponent。動画と写真を同様に扱えるようにするため、Composite Pattern で書いている。確かにあとから書いていて楽だった。

HoloFactory。写真と動画の分岐を隠蔽するくらいしか使えていないが、Simple Factory patternはよく使うので、一応

ShowHolo。Strategy pattern で書いてみたものの、media形式をそろえていることや機能が少ないことから活躍しているとは言えない。課金とかの要素が増えると、ここのstrategyが増えたりする予定。

---
memo

まずnpm install -g @nestjs/cliでnestのcliを入れる  
nest new MyAppで作成

githubでrepo作成  
localで  
git init  
git remote add origin  
git remote set-url origin <repoのsshのリンク>  
