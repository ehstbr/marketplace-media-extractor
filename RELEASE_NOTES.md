# Release Notes — 0.4.1

Esta release é focada em desempenho de lotes de imagens.

## Destaques

- downloads de imagens com concorrência controlada;
- quantidade de downloads simultâneos configurável;
- conversões JPEG/PNG/WebP com limite de concorrência independente;
- modo Automático baseado em `navigator.hardwareConcurrency`;
- probes de variantes executados em paralelo;
- barra de progresso com itens concluídos, em processamento e na fila;
- vídeos continuam sequenciais para evitar excesso de memória/rede.
