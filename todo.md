# Sicília Trip Planner - TODO

## Schema & Backend
- [x] Schema: tabela `attractions` (nome, descrição, lat/lng, status, placeId, foto, avaliação)
- [x] Schema: tabela `itinerary_days` (dia 1-5, ordem das atrações)
- [x] Schema: tabela `attraction_days` (relação atração ↔ dia + ordem)
- [x] Schema: tabela `votes` (usuário, atração, tipo favorito)
- [x] tRPC: CRUD de atrações
- [x] tRPC: busca via Google Places API
- [x] tRPC: gerenciar dias do itinerário (adicionar/remover/reordenar)
- [x] tRPC: votar/favoritar atração
- [x] tRPC: calcular rota do dia via Google Directions API

## Frontend - Mapa
- [x] Integração com MapView (componente existente)
- [x] Marcadores no mapa para cada atração
- [x] Cores diferentes por status (ideia vs confirmada)
- [x] InfoWindow com detalhes da atração ao clicar
- [x] Busca de atrações via Google Places (autocomplete)
- [x] Desenhar rota do dia selecionado no mapa

## Frontend - Painel de Atrações
- [x] Lista de todas as atrações com status (ideia/confirmada)
- [x] Botão de favorito/voto por atração
- [x] Filtro por status e dia
- [x] Adicionar atração manualmente ou via Places
- [x] Foto e avaliação da atração (quando disponível)

## Frontend - Itinerário por Dia
- [x] Painel com 5 dias da viagem
- [x] Drag-and-drop entre dias e "banco de ideias"
- [x] Mostrar tempo e distância entre atrações do dia
- [x] Reordenar atrações dentro do mesmo dia
- [x] Indicador visual de dia selecionado (rota no mapa)

## Visual & UX
- [x] Layout responsivo com sidebar + mapa
- [x] Tema claro, limpo e funcional (paleta mediterrânea)
- [x] Animações suaves no drag-and-drop
- [x] Toast de feedback para ações
- [x] Estado vazio com instruções de uso

## Testes
- [x] Testes vitest para rotas tRPC principais (11 testes passando)
