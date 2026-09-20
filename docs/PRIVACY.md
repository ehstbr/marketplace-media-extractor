# Privacidade

O Marketplace Media Extractor foi projetado para operar localmente no navegador.

## Dados processados

A extensão pode acessar a página do anúncio atual e recursos de mídia relacionados para identificar imagens, vídeos, playlists e segmentos necessários ao download.

## Armazenamento

Preferências e configurações ficam no `chrome.storage.local`.

## Rede

A extensão acessa domínios do Mercado Livre e seus CDNs para resolver e baixar mídias. O projeto não exige um backend próprio para receber, armazenar ou processar as mídias do usuário.

## Permissões

As permissões do Manifest V3 são usadas para:

- `storage`: salvar preferências;
- `downloads`: iniciar e acompanhar downloads;
- `offscreen`: processamento local quando necessário;
- `webRequest`: observar recursos de vídeo e auxiliar a identificação de streams.

## Telemetria

O projeto não inclui, por padrão, um serviço próprio de telemetria ou upload de dados para servidores do projeto.
