# cDNA Master Mix Calculator Pro - Documentação Técnica

## Visão Geral

O **cDNA Master Mix Calculator Pro** é uma aplicação web profissional desenvolvida especificamente para cientistas e pesquisadores de biologia molecular. A ferramenta simplifica e padroniza o processo de cálculo de Master Mix para reações de síntese de cDNA, oferecendo personalização completa de kits, cálculos em tempo real e acesso rápido aos protocolos do termociclador.

## Funcionalidades Principais

### 1. Sistema de Gerenciamento de Kits
- **Criação de Kits Personalizados**: Permite criar kits totalmente customizados com reagentes específicos
- **Persistência de Dados**: Todos os kits são salvos automaticamente no navegador usando localStorage
- **Operações CRUD**: Criar, visualizar, editar e excluir kits personalizados
- **Kit Padrão**: Inclui um kit genérico de exemplo para facilitar o primeiro uso

### 2. Calculadora de Master Mix
- **Cálculos em Tempo Real**: Os volumes são recalculados automaticamente a cada alteração
- **Seleção de Kit**: Dropdown para escolher entre kits salvos
- **Número de Amostras**: Campo numérico para definir quantas reações preparar
- **Margem de Segurança**: Duas opções disponíveis:
  - **Amostras Extras**: Adiciona um número específico de reações extras
  - **Porcentagem Extra**: Adiciona uma porcentagem ao volume total
- **Tabela de Resultados**: Exibe reagentes, volumes por reação e volumes totais
- **Volume Total Final**: Soma automática de todos os volumes do Master Mix

### 3. Sistema de Protocolos
- **Protocolos Personalizados**: Cada kit pode ter seu próprio protocolo do termociclador
- **Acesso Rápido**: Ícone de termômetro ao lado do kit selecionado
- **Modal de Visualização**: Exibe o protocolo em formato claro e legível

## Tecnologias Utilizadas

- **React 18**: Framework JavaScript para interface de usuário
- **Vite**: Ferramenta de build rápida e moderna
- **Tailwind CSS**: Framework CSS para estilização
- **shadcn/ui**: Biblioteca de componentes UI profissionais
- **Lucide Icons**: Ícones modernos e consistentes
- **localStorage**: Persistência de dados no navegador

## Estrutura do Projeto

```
cdna-calculator/
├── public/                 # Arquivos públicos
├── src/
│   ├── components/
│   │   └── ui/            # Componentes UI (shadcn/ui)
│   ├── assets/            # Recursos estáticos
│   ├── App.jsx            # Componente principal
│   ├── App.css            # Estilos principais
│   ├── main.jsx           # Ponto de entrada
│   └── index.css          # Estilos globais
├── dist/                  # Build de produção
├── package.json           # Dependências e scripts
└── vite.config.js         # Configuração do Vite
```

## Como Usar

### Primeiro Uso
1. Abra a aplicação no navegador
2. Explore o kit de exemplo já carregado
3. Clique em "Gerenciar Kits" para criar seu primeiro kit personalizado
4. Preencha o nome do kit, reagentes, volumes e protocolo
5. Clique em "Criar Kit" para salvar

### Uso Diário
1. Selecione seu kit no dropdown
2. Insira o número de amostras
3. Escolha a margem de segurança (amostras extras ou porcentagem)
4. Visualize os resultados calculados automaticamente
5. Use o ícone do termômetro para acessar o protocolo quando necessário

## Estrutura de Dados

### Kit
```javascript
{
  id: "string",           // ID único do kit
  name: "string",         // Nome do kit
  reagents: [             // Array de reagentes
    {
      name: "string",     // Nome do reagente
      volumePerReaction: number  // Volume em µL por reação
    }
  ],
  protocol: "string"      // Protocolo do termociclador (opcional)
}
```

## Fórmulas de Cálculo

### Amostras Extras
```
Volume Total = Volume por Reação × (Número de Amostras + Amostras Extras)
```

### Porcentagem Extra
```
Volume Total = Volume por Reação × Número de Amostras × (1 + Porcentagem/100)
```

## Recursos Avançados

- **Validação de Dados**: Impede a criação de kits com campos vazios
- **Interface Responsiva**: Funciona em desktops, tablets e dispositivos móveis
- **Feedback Visual**: Estados de hover, transições suaves e micro-interações
- **Acessibilidade**: Labels apropriados e navegação por teclado
- **Performance**: Cálculos otimizados e renderização eficiente

## Manutenção e Extensibilidade

O código foi estruturado de forma modular e bem documentada, facilitando:
- Adição de novos tipos de cálculo
- Implementação de novos formatos de export
- Integração com APIs externas
- Personalização de temas e estilos

## Suporte e Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões modernas)
- **Dispositivos**: Desktop, tablet, mobile
- **Persistência**: Dados salvos localmente no navegador
- **Offline**: Funciona sem conexão à internet após carregamento inicial

## Conclusão

O cDNA Master Mix Calculator Pro representa uma solução completa e profissional para cálculos de Master Mix em laboratórios de biologia molecular. Com sua interface intuitiva, funcionalidades avançadas e design responsivo, a ferramenta atende às necessidades tanto de pesquisadores experientes quanto de estudantes iniciantes na área.

