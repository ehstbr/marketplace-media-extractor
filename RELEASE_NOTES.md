# Marketplace Media Extractor v0.4.3

## Corrigido

A extensão podia aparecer em páginas que não eram anúncios, como lojas oficiais, vitrines e listagens, especialmente quando a URL continha um parâmetro `item_id`.

Agora os controles são ativados somente quando a página é reconhecida como uma página real de detalhe de produto/anúncio.

### Comportamento esperado

- ✅ Página de produto/anúncio: controles disponíveis
- ✅ Página de catálogo de produto: controles disponíveis
- ❌ Loja oficial: sem controles
- ❌ Busca/listagem: sem controles
- ❌ Categoria/ofertas: sem controles
- ❌ Página de Clips: sem controles globais do extrator

Também foi adicionada limpeza automática dos controles ao sair de um anúncio por navegação dinâmica do Mercado Livre.
