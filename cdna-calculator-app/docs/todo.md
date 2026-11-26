# cDNA Master Mix Calculator Pro - Todo List

## Fase 1: Planejamento e estruturação do projeto ✅
- [x] Criar projeto React
- [x] Atualizar título da aplicação
- [x] Analisar estrutura do projeto
- [x] Planejar componentes principais
- [x] Definir estrutura de dados para kits

## Fase 2: Desenvolvimento da estrutura base e interface principal ✅
- [x] Criar layout principal da aplicação
- [x] Implementar header com título e navegação
- [x] Criar componente principal da calculadora
- [x] Implementar design responsivo

## Fase 3: Implementação do sistema de gerenciamento de kits ✅
- [x] Criar estrutura de dados para kits
- [x] Implementar localStorage para persistência
- [x] Criar modal de criação/edição de kits
- [x] Implementar funcionalidades CRUD para kits
- [x] Adicionar kits padrão de exemplo

## Fase 4: Desenvolvimento da calculadora de Master Mix ✅
- [x] Implementar seleção de kit
- [x] Criar inputs para número de amostras
- [x] Implementar opções de margem de segurança
- [x] Criar tabela de resultados em tempo real
- [x] Calcular volume total do Master Mix

## Fase 5: Implementação do sistema de protocolos ✅
- [x] Adicionar campo de protocolo aos kits
- [x] Criar modal de exibição de protocolos
- [x] Implementar ícone de acesso ao protocolo

## Fase 6: Testes, refinamentos e deploy ✅
- [x] Testar todas as funcionalidades
- [x] Verificar responsividade
- [x] Fazer ajustes de UI/UX
- [x] Deploy da aplicação

## ✅ PROJETO CONCLUÍDO COM SUCESSO! ✅

### Funcionalidades Implementadas:
- ✅ Sistema completo de gerenciamento de kits (CRUD)
- ✅ Calculadora de Master Mix em tempo real
- ✅ Persistência de dados com localStorage
- ✅ Opções de margem de segurança (amostras extras e porcentagem)
- ✅ Sistema de protocolos do termociclador
- ✅ Interface responsiva e profissional
- ✅ Kits padrão de exemplo
- ✅ Validação de dados
- ✅ Deploy realizado


---

# Roadmap (nov/2026)

## Feito
- [x] Tabela de preparo das amostras (RNA + água), normalizar massa, colar do Excel, CSV, impressão (PR #1)
- [x] Diluição pronta: receita (µL de RNA + água) e botão "Já diluí" que atualiza a concentração
- [x] Protocolo do kit padrão: síntese de 120 min em 2 × 60 min (limite do termociclador do lab)
- [x] Logo otimizado (5 MB → ~50 KB) e limpeza de arquivos soltos em `src/`

- [x] Histórico de experimentos: nome (opcional), responsável, data e tabela de amostras; ver, imprimir, carregar, exportar/importar
- [x] Modo bancada para celular/tablet: checklist do mix e dos tubos, letras ajustáveis, tela sempre acesa
- [x] App instalável e offline (PWA)

## Lista de finalização
- [ ] Controles No-RT e NTC (mix sem transcriptase calculado automaticamente)
- [ ] Qualidade do RNA na tabela (A260/280 e A260/230 ao colar do NanoDrop)
- [ ] Kits compartilhados pelo laboratório (banco na nuvem + login)
- [ ] Testes automáticos das fórmulas de cálculo
- [ ] Mapa de placas: já existe em outro app (qplate-architect.vercel.app) — avaliar integração
