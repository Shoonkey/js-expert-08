# Semana JS Expert 8.0 - Fork

Fork da oitava Semana Javascript Expert

## Preview
<img width=100% src="./initial-template/demo.gif">

## Ideia

Processar vídeos sob demanda no cliente (navegador do usuário) em vez de no servidor para economizar custos de processamento

### Techs usadas

- Processamento em segundo plano: Web workers
- Processamento de vídeo: Web Codecs API, mp4box e webm-writer
- Envio de dados sob demanda: Web streams

### Processo

- Baixa o arquivo mp4 sob demanda
- Demultiplexa vídeos (separa em fragmentos e adquire informações sobre eles) com o mp4box
- Encoda cada fragmento com o VideoEncoder (Web Codecs API)
- Multiplexa fragmentos
- Faz upload dos fragmentos em Webm, um encoding gratuito
- Decoda fragmentos com VideoDecoder (Web Codecs API)


## Requisitos
- NodeJS v18.x.x
- Ambiente Unix (Linux ou Windows WSL)
- Navegador Chrome: alguns navegadores podem não suportar a Web Codecs API e o ECMAScript Modules em workers

## Rodando o projeto
- Execute `npm ci` nas pastas `app/` e `webserver/` para instalar as dependências
- Execute `npm start` pra iniciar as aplicações

## Recursos
- Video Uploader
  - [x] Deve entender videos em formato MP4 mesmo se não estiverem fragmentados
  - [x] Deve processar itens em threads isoladas com Web Workers
  - [x] Deve converter fragmentos de videos em formato `144p`
  - [x] Deve renderizar frames em tempo real em elemento canvas
  - [x] Deve gerar arquivos WebM a partir de fragmentos

### Desafios
- [ ] Encodar em 360p e 720p
- [ ] Fazer encoding/decoding track de áudio
- [ ] Fazer também upload de track de áudio
- [ ] Concatenar o arquivo final no servidor em um arquivo só
- [ ] Corrigir problema do Webm de não mostrar a duração do video
- [ ] Corrigir a responsividade do site
- [ ] Tentar usar outros muxers: [webm-muxer](https://github.com/Vanilagy/webm-muxer), [mp4-muxer](https://github.com/Vanilagy/mp4-muxer)
