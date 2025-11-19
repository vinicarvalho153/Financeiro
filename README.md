# 💰 Controle Financeiro - Salários

Sistema de controle financeiro para duas pessoas, permitindo cadastrar salários individuais e conjuntos, com projeção gráfica dos próximos meses.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta no Supabase (gratuita)

## 🚀 Instalação

### 1. Instalar Node.js

Se você ainda não tem o Node.js instalado:

1. Acesse [nodejs.org](https://nodejs.org/)
2. Baixe e instale a versão LTS (Long Term Support)
3. Verifique a instalação executando no terminal:
```bash
node --version
npm --version
```

### 2. Instalar Dependências do Projeto

No diretório do projeto, execute:

```bash
npm install
```

### 3. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Crie um novo projeto
3. Vá até **SQL Editor** no painel do Supabase
4. Execute o script SQL que está em `supabase/schema.sql` para criar a tabela
5. Vá até **Settings > API** e copie:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

**Exemplo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Executar o Projeto

```bash
npm run dev
```

O site estará disponível em: [http://localhost:3000](http://localhost:3000)

## 🎯 Funcionalidades

- ✅ Cadastro de salários (conjunto, pessoa 1 e pessoa 2)
- ✅ Edição de valores e descrições
- ✅ Exclusão de registros
- ✅ Resumo financeiro (total geral e por tipo)
- ✅ Gráfico de projeção para os próximos 12 meses
- ✅ Controle de gastos fixos e parcelados (cadastro de parcelas e status de pagamento)
- ✅ **Editor de Configurações**: Edite todos os textos fixos do site (títulos, nomes das pessoas, rótulos, mensagens, etc.)
- ✅ Interface moderna e responsiva
- ✅ Banco de dados Supabase (gratuito)

## 🗃️ Estrutura do Banco (Supabase)

Execute o script `supabase/schema.sql` para criar automaticamente:

- Tabela `salaries` (salários individuais/conjuntos)
- Tabela `site_config` (textos e rótulos editáveis)
- **Tabela `expenses`** (gastos fixos ou parcelados)
- **Tabela `installments`** (parcelas geradas automaticamente para gastos parcelados)

> Se você já tinha executado o script anteriormente, rode novamente para aplicar as novas tabelas de gastos/parcelas.

## 📊 Como Usar

1. **Adicionar Salário**: Clique em "Adicionar Salário" e preencha:
   - Tipo (Conjunto, Pessoa 1 ou Pessoa 2)
   - Nome/Descrição
   - Valor

2. **Editar Salário**: Clique no ícone de lápis na lista de salários

3. **Excluir Salário**: Clique no ícone de lixeira na lista de salários

4. **Visualizar Projeção**: O gráfico mostra automaticamente a projeção baseada na média dos salários cadastrados

5. **Cadastrar Gastos/Parcelamentos**:
   - Clique em "Adicionar Gasto"
   - Escolha entre "Gasto Fixo" (valor mensal) ou "Gasto Parcelado"
   - Para parcelados, informe o valor total, número de parcelas e data da primeira parcela
   - Acompanhe as parcelas e marque-as como pagas diretamente na lista

6. **Editar Configurações do Site**: Clique no botão "Configurações" no canto superior direito para:
   - Editar nomes das pessoas (Pessoa 1, Pessoa 2)
   - Editar títulos e subtítulos do site
   - Editar rótulos dos cards e formulários
   - Editar textos dos botões
   - Editar mensagens do sistema
   - Tudo é salvo automaticamente no banco de dados

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Banco de dados PostgreSQL
- **Recharts** - Gráficos
- **Lucide React** - Ícones

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa o linter

## 🔒 Segurança

⚠️ **Importante**: O arquivo `.env.local` contém informações sensíveis e não deve ser commitado no Git. Ele já está no `.gitignore`.

Em produção, ajuste as políticas RLS (Row Level Security) do Supabase conforme sua necessidade de segurança.

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.

---

Desenvolvido com ❤️ para controle financeiro pessoal
