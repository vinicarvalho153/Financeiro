# Configuração do Supabase

## Passo a Passo para Configurar o Banco de Dados

### 1. Criar o arquivo `.env.local`

Na raiz do projeto, crie um arquivo chamado `.env.local` com o seguinte conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 2. Obter as Credenciais do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** > **API**
4. Copie o **Project URL** e cole no `NEXT_PUBLIC_SUPABASE_URL`
5. Copie a **anon public** key e cole no `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Criar as Tabelas no Banco de Dados

1. No Supabase Dashboard, vá em **SQL Editor**
2. Abra o arquivo `supabase/schema.sql` deste projeto
3. Copie todo o conteúdo do arquivo
4. Cole no SQL Editor do Supabase
5. Clique em **Run** para executar

Isso criará todas as tabelas necessárias:
- `salaries` - Receitas/Salários
- `expenses` - Despesas
- `installments` - Parcelas
- `site_config` - Configurações do site
- `projection_monthly` - Projeções mensais

### 4. Verificar as Políticas RLS (Row Level Security)

As políticas RLS já estão configuradas no schema.sql para permitir todas as operações. Se você encontrar problemas de permissão:

1. Vá em **Authentication** > **Policies**
2. Verifique se as políticas estão ativas para todas as tabelas

### 5. Reiniciar o Servidor de Desenvolvimento

Após configurar o `.env.local`, reinicie o servidor:

```bash
npm run dev
```

## Solução de Problemas

### Erro: "Supabase não configurado"
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Verifique se as variáveis estão com os nomes corretos (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Reinicie o servidor após criar/editar o `.env.local`

### Erro: "new row violates row-level security policy"
- Execute novamente o schema.sql no SQL Editor
- Verifique se as políticas RLS estão ativas

### Erro: "relation does not exist"
- Execute o schema.sql no SQL Editor do Supabase
- Verifique se todas as tabelas foram criadas corretamente

### Erro ao salvar dados
- Verifique o console do navegador (F12) para ver os detalhes do erro
- Verifique se as credenciais estão corretas no `.env.local`
- Verifique se as tabelas foram criadas corretamente

## Estrutura das Tabelas

### salaries
- `id` (UUID, Primary Key)
- `person` (VARCHAR) - 'person1', 'person2', 'conjunto', 'vr'
- `name` (VARCHAR) - Nome da receita
- `value` (DECIMAL) - Valor
- `created_at`, `updated_at` (TIMESTAMP)

### expenses
- `id` (UUID, Primary Key)
- `name` (VARCHAR) - Nome da despesa
- `category` (VARCHAR) - Categoria
- `amount` (DECIMAL) - Valor
- `type` (VARCHAR) - 'fixo', 'parcelado', 'unico'
- `paid_by` (VARCHAR) - 'person1', 'person2', 'vr', 'conjunto'
- `is_recurring` (BOOLEAN)
- `total_installments` (INT) - Número de parcelas
- `notes` (TEXT)
- `start_date` (DATE) - Data inicial para parcelas
- `due_date` (DATE) - Data de vencimento
- `created_at`, `updated_at` (TIMESTAMP)

### installments
- `id` (UUID, Primary Key)
- `expense_id` (UUID, Foreign Key) - Referência a expenses
- `installment_number` (INT) - Número da parcela
- `amount` (DECIMAL) - Valor da parcela
- `due_date` (DATE) - Data de vencimento
- `status` (VARCHAR) - 'pending' ou 'paid'
- `paid_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)
