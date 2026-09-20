<p align="center">
  <img src="docs/banner.png" alt="Marketplace Media Extractor" width="100%">
</p>

# Marketplace Media Extractor

Extensão para Google Chrome/Chromium que facilita a extração e o download de **imagens e vídeos de anúncios de marketplaces**, começando pelo **Mercado Livre**.

O projeto procura a melhor mídia disponível no anúncio, adiciona atalhos diretamente na página, permite preparar e renomear lotes de arquivos e mantém todo o processamento local no navegador.

<p>
  <a href="https://eduhcommerce.com.br"><strong>Site</strong></a> ·
  <a href="https://instagram.com/eduhcommmerce"><strong>Instagram @eduhcommmerce</strong></a> ·
  <a href="https://github.com/ehstbr/marketplace-media-extractor"><strong>GitHub</strong></a>
</p>

## Principais recursos

- Download da **mídia atual** diretamente sobre a galeria do produto.
- Download em lote das mídias do anúncio.
- Imagens em **Original, JPEG, PNG ou WebP**.
- Busca da melhor variante/resolução disponível no CDN do Mercado Livre.
- Conversão local de imagens, sem backend próprio.
- Suporte a Clips com **MP4/WebM direto** e **HLS MPEG-TS** quando detectados.
- Edição do **nome do produto** antes de salvar.
- Templates de nomes e pastas, como `{produto}-{numero_imagem:02}`.
- Controles opcionais nas miniaturas da galeria.
- Menu flutuante e configurações integradas à própria página.
- Barra de progresso de downloads.
- Fila concorrente para acelerar lotes de imagens.
- Concorrência de downloads e conversões configurável.
- Onboarding no primeiro uso.
- Modo de diagnóstico técnico para vídeos.

## Marketplace suportado

Atualmente o provider principal é o **Mercado Livre Brasil**.

A arquitetura foi pensada para permitir novos providers futuramente, como Shopee, Amazon, Magalu e outros marketplaces.

## Instalação manual

Enquanto a extensão não estiver publicada na Chrome Web Store:

1. Baixe o pacote da release desejada e extraia-o.
2. Abra `chrome://extensions` no Chrome/Chromium.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta da extensão, onde está o `manifest.json`.
6. Abra um anúncio do Mercado Livre e recarregue a página, se necessário.

## Como usar

Ao abrir um anúncio compatível, a extensão pode adicionar controles diretamente à galeria e também disponibilizar um botão flutuante no canto inferior direito.

O fluxo mais comum é:

1. abrir o anúncio;
2. clicar em **Baixar esta mídia** ou **Baixar tudo**;
3. quando necessário, abrir **Preparar download**;
4. revisar nome do produto, seleção, formato e organização;
5. iniciar o download.

## Nomes e organização

A extensão oferece templates para nomes de arquivos e pastas. Exemplos:

```text
Pasta:
{produto}

Imagens:
{produto}-{numero_imagem:02}

Vídeos:
{produto}-video-{numero_video:02}

Capa do vídeo:
{produto}-video-{numero_video:02}-capa
```

Exemplo de resultado:

```text
Motobatt MBTZ14S - Suzuki Hayabusa/
├── Motobatt MBTZ14S - Suzuki Hayabusa-01.jpg
├── Motobatt MBTZ14S - Suzuki Hayabusa-02.jpg
└── Motobatt MBTZ14S - Suzuki Hayabusa-video-01.ts
```

## Desempenho

Downloads de imagens usam uma fila com concorrência controlada. O modo **Automático** dimensiona o paralelismo de acordo com a capacidade do dispositivo, e também existe um limite independente para conversões JPEG/PNG/WebP.

Vídeos são processados de forma mais conservadora, enquanto segmentos HLS podem ser baixados em paralelo.

## Privacidade

O Marketplace Media Extractor foi projetado para trabalhar **localmente no navegador**.

- Não exige conta própria.
- Não possui backend do projeto para receber suas mídias.
- Preferências ficam no armazenamento local da extensão.
- Conversões de imagem são executadas localmente.
- O acesso à rede é usado para localizar/baixar as mídias necessárias ao funcionamento.

Veja mais em [docs/PRIVACY.md](docs/PRIVACY.md).

## Estrutura do projeto

```text
marketplace-media-extractor/
├── assets/
│   └── icons/
├── background/
│   └── service-worker.js
├── content/
│   ├── bootstrap.js
│   ├── core.js
│   ├── extractor.js
│   └── ui.js
├── offscreen/
│   ├── offscreen.html
│   └── offscreen.js
├── onboarding/
│   ├── onboarding.html
│   └── onboarding.js
├── options/
│   ├── options.html
│   └── options.js
├── docs/
├── manifest.json
└── README.md
```

Mais detalhes em [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Roadmap

Alguns dos próximos passos planejados:

- tratamento estruturado de **variações** de produto;
- associação de grupos de mídia às variações;
- evolução do suporte HLS para saída MP4 sem recompressão quando viável;
- novos marketplaces/providers;
- melhoria contínua da identificação da galeria e de Clips.

Veja [docs/ROADMAP.md](docs/ROADMAP.md).

## Contribuindo

Issues e pull requests são bem-vindos. Antes de contribuir, consulte [CONTRIBUTING.md](CONTRIBUTING.md).

## Uso responsável

Use a extensão apenas para mídias que você tenha autorização ou direito de utilizar. O usuário é responsável por respeitar direitos autorais, termos de uso dos marketplaces e demais regras aplicáveis.

## Projeto

Desenvolvido por **EduhCommerce**.

- Site: https://eduhcommerce.com.br
- Instagram: [@eduhcommmerce](https://instagram.com/eduhcommmerce)
- Repositório: https://github.com/ehstbr/marketplace-media-extractor
