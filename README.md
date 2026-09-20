# Marketplace Media Extractor v0.4.3

Correção de escopo de execução no Mercado Livre.

## O que mudou

- os controles da extensão agora aparecem somente em páginas de detalhe de produto/anúncio;
- lojas oficiais, vitrines, buscas, categorias, listagens e páginas de Clips não recebem mais o botão flutuante nem controles nas imagens;
- parâmetros como `item_id=MLB...` em páginas de loja não são mais usados isoladamente para classificar a página como anúncio;
- ao navegar de um anúncio para uma página não suportada via SPA, os controles são removidos automaticamente;
- ao clicar no ícone da extensão fora de um anúncio, o Chrome abre a página de opções em vez do modal in-page.

## Páginas de produto reconhecidas

A detecção cobre as famílias atuais do Mercado Livre, incluindo:

- páginas de catálogo `/p/MLB...`;
- páginas user-product `/up/MLBU...`;
- URLs diretas de item `MLB-...`;
- fallback conservador por DOM quando o Mercado Livre alterar a estrutura de URL.
