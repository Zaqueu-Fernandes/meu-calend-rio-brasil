

# MeuCalendario 🗓️🇧🇷

Um aplicativo web moderno de calendário brasileiro, colorido e vibrante, com feriados nacionais, fases da lua, e sistema de eventos pessoais.

## Páginas e Funcionalidades

### 1. Tela de Login / Cadastro
- Login com email e senha via Supabase Auth
- Opção de criar conta
- Interface em português do Brasil
- Design colorido e acolhedor

### 2. Calendário Principal (Página Inicial)
- Visualização mensal com navegação entre meses/anos
- **Feriados nacionais brasileiros** destacados com cores especiais (ex: Carnaval, Tiradentes, Independência, etc.)
- **Fases da lua** exibidas em cada dia (🌑 Nova, 🌓 Crescente, 🌕 Cheia, 🌗 Minguante) - calculadas automaticamente
- Indicadores visuais para dias com eventos pessoais
- Dia atual destacado
- Design vibrante com cores temáticas para cada tipo de evento

### 3. Gerenciamento de Eventos Pessoais
- Criar, editar e excluir compromissos pessoais
- Campos: título, descrição, data, horário, cor
- Eventos salvos no Supabase vinculados ao usuário logado
- Lista de eventos do dia ao clicar em uma data

### 4. Painel Lateral / Detalhes do Dia
- Ao clicar em um dia, exibe detalhes: feriados, fase da lua e eventos pessoais
- Botão rápido para adicionar novo evento

### 5. Visualização de Feriados
- Lista completa dos feriados nacionais brasileiros do ano
- Incluindo feriados fixos e móveis (Carnaval, Páscoa, Corpus Christi, etc.)

## Feriados Incluídos
- Confraternização Universal (1º Jan)
- Carnaval (móvel)
- Sexta-feira Santa (móvel)
- Tiradentes (21 Abr)
- Dia do Trabalho (1º Mai)
- Corpus Christi (móvel)
- Independência do Brasil (7 Set)
- Nossa Senhora Aparecida (12 Out)
- Finados (2 Nov)
- Proclamação da República (15 Nov)
- Natal (25 Dez)

## Backend (Supabase / Lovable Cloud)
- Tabela de **profiles** (criada automaticamente no cadastro)
- Tabela de **eventos** (título, descrição, data, horário, cor, user_id)
- Autenticação com email/senha
- RLS para que cada usuário veja apenas seus eventos

## PWA (Instalável no Celular)
- Configuração de PWA com vite-plugin-pwa
- Manifesto com ícones e nome "MeuCalendario"
- Funciona offline e pode ser instalado na tela inicial do celular
- Página `/install` com instruções de instalação

## Design
- Paleta colorida e vibrante com tons de verde, amarelo e azul (remetendo ao Brasil)
- Interface responsiva (funciona bem no celular e desktop)
- Tipografia moderna e legível
- Animações suaves nas transições
- Todo o texto em português do Brasil

