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


## Mudanças Solicitadas - Fase 2

### Suporte a Múltiplas Viagens
- [x] Schema: tabela `trips` (nome, descrição, data_início, data_fim, usuário_dono)
- [x] Schema: atualizar `attractions` para referenciar `trips`
- [x] Schema: atualizar `itinerary_days` para referenciar `trips`
- [x] tRPC: CRUD de viagens
- [x] Frontend: seletor/modal de viagens ao conectar
- [x] Frontend: criar nova viagem

### Horários dos Dias
- [x] Schema: adicionar `start_time` e `end_time` em `itinerary_days`
- [x] Schema: adicionar `time` em `attraction_days` (horário da atração no dia)
- [x] tRPC: atualizar/obter horários
- [x] Frontend: editor de horários no painel de itinerário
- [x] Frontend: mostrar horários no card de atração

### Alojamentos
- [x] Schema: tabela `accommodations` (nome, endereço, lat/lng, check-in, check-out, notas)
- [x] Schema: relação `accommodation_days` (qual alojamento em cada dia)
- [x] tRPC: CRUD de alojamentos
- [x] Frontend: aba de alojamentos
- [x] Frontend: adicionar/editar alojamento via Places ou manual
- [x] Frontend: marcador verde para alojamentos no mapa

### Cores por Tipo de Marcador
- [x] Frontend: marcador amarelo para atrações turísticas
- [x] Frontend: marcador verde para alojamentos
- [x] Frontend: atualizar legenda do mapa
- [x] Frontend: filtrar por tipo de marcador

### Exportação para Google Drive
- [x] Integração OAuth com Google Drive
- [x] tRPC: gerar documento com roteiro
- [x] tRPC: fazer upload para Google Drive
- [x] Frontend: botão de exportar
- [x] Frontend: feedback de sucesso/erro


## Mudanças Solicitadas - Fase 3

### Mudar Nome para "Voyage Planner"
- [x] Corrigir erro de hooks no Home.tsx (conditional returns)
- [x] Mudar "Sicília Trip Planner" para "Voyage Planner" no código
- [x] Atualizar títulos e labels na interface
- [x] Testar e validar funcionamento


## Mudanças Solicitadas - Fase 4

### Wizard de Criação de Viagem
- [x] Schema: adicionar campos `numDays`, `startDate`, `location` à tabela `trips`
- [x] Schema: tabela `trip_collaborators` (usuário, viagem, permissões)
- [x] tRPC: criar wizard com perguntas (dias, data, local)
- [x] tRPC: adicionar colaboradores à viagem
- [x] Frontend: componente TripWizard com formulário multi-etapa
- [x] Frontend: validação de dados do wizard

### Compartilhamento Colaborativo
- [x] Backend: sistema de notificações para mudanças na viagem
- [x] Backend: WebSocket ou polling para atualizações em tempo real
- [x] Frontend: indicador de quem está editando
- [x] Frontend: histórico de mudanças

### Persistência de Sessão
- [x] Frontend: armazenar `selectedTripId` no localStorage
- [x] Frontend: recuperar viagem ao recarregar página
- [x] Frontend: opção de "Sair da Viagem" mantendo sessão de usuário

### Exportação Melhorada
- [x] Backend: integração com Google Drive API para seleção de pasta
- [x] Backend: compartilhamento automático com colaboradores
- [x] Frontend: dialog para seleção de pasta no Drive
- [x] Frontend: feedback de progresso da exportação

### Limpeza de Dados
- [x] Remover viagens de teste (Test Trip, Sicília Export Test, etc)
- [x] Limpar dados de teste do banco

### Testes
- [ ] Testes para wizard de criação
- [ ] Testes para compartilhamento colaborativo


## Mudanças Solicitadas - Fase 5

### Corrigir Adição de Atrações aos Dias
- [x] Diagnosticar por que atrações não estão sendo adicionadas aos dias
- [x] Implementar múltiplas atrações por dia com horários dedicados
- [x] Mostrar horário de cada atração no card do dia

### Aba de Alojamentos
- [x] Criar aba "Alojamentos" no itinerário
- [x] Implementar adição de alojamentos via Google Places ou manual
- [x] Marcadores verdes para alojamentos no mapa
- [x] Filtro de marcadores (atrações/alojamentos)

### Alojamentos por Dia
- [x] Permitir atribuir alojamento a cada dia
- [x] Mostrar alojamento no painel de cada dia
- [x] Sincronizar com mapa

### Deletar Viagens
- [x] Adicionar botão de deletar viagem no TripSelector
- [x] Confirmação antes de deletar
- [x] Remover viagem do banco de dados


## Mudanças Solicitadas - Fase 6

### Confirmar Ideias com Mudança de Cor
- [x] Adicionar botão "Confirmar" em cada atração
- [x] Mudar status de "ideia" para "confirmada"
- [x] Marcador fica verde no mapa quando confirmado
- [x] Sincronizar com backend

### Alterar Cor de Alojamentos
- [x] Mudar cor de alojamentos de verde para azul no mapa
- [x] Atualizar legenda do mapa

### Persistir Atrações aos Dias
- [x] Salvar atrações adicionadas ao dia no banco de dados
- [x] Carregar atrações ao abrir o dia
- [x] Não remover atração ao recarregar página

### Múltiplas Atrações por Dia
- [x] Permitir adicionar várias atrações ao mesmo dia
- [x] Mostrar lista de atrações do dia
- [x] Permitir reordenar atrações dentro do dia
