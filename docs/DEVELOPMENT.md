# Desenvolvimento

## Requisitos

Não há etapa de build obrigatória nesta versão. A extensão é composta por HTML, CSS e JavaScript compatíveis com Manifest V3.

## Arquitetura

- `background/service-worker.js`: downloads, estado de background e tarefas que precisam do service worker.
- `content/core.js`: estado e utilitários compartilhados no contexto de conteúdo.
- `content/extractor.js`: identificação do anúncio e das mídias.
- `content/ui.js`: controles da galeria, botão flutuante, modais e progresso.
- `content/bootstrap.js`: inicialização e observação da página.
- `offscreen/`: processamento offscreen/conversões.
- `onboarding/`: primeira experiência após instalação.
- `options/`: página fallback de configurações.

## Validação rápida

```bash
node --check background/service-worker.js
node --check content/core.js
node --check content/extractor.js
node --check content/ui.js
node --check content/bootstrap.js
node --check offscreen/offscreen.js
node --check onboarding/onboarding.js
node --check options/options.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"
```

A workflow em `.github/workflows/validate.yml` executa essa validação automaticamente em pushes e pull requests.
