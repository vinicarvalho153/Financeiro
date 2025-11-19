# 🚀 Configuração do Vercel - Variáveis de Ambiente

Este guia mostra como configurar as variáveis de ambiente do Supabase no Vercel.

## 📋 Passo a Passo

### 1. Acesse o Painel do Vercel

1. Acesse: https://vercel.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **Financeiro**

### 2. Configure as Variáveis de Ambiente

1. No menu lateral, clique em **Settings**
2. Clique em **Environment Variables** (no menu lateral esquerdo)
3. Você verá uma lista de variáveis (provavelmente vazia)

### 3. Adicionar a Primeira Variável: NEXT_PUBLIC_SUPABASE_URL

1. Clique no botão **Add New**
2. Preencha:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://xsyupulaqvbgzkqzgzvi.supabase.co`
   - **Environments**: Marque todas as opções:
     - ☑️ Production
     - ☑️ Preview  
     - ☑️ Development
3. Clique em **Save**

### 4. Adicionar a Segunda Variável: NEXT_PUBLIC_SUPABASE_ANON_KEY

1. Clique novamente em **Add New**
2. Preencha:
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzeXVwdWxhcXZiZ3prcXpnenZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTE4NTIsImV4cCI6MjA3OTEyNzg1Mn0.Yo51H-di__6RYoNT5atE3-4qDtOCQVM1ruDOcrb2HZI`
   - **Environments**: Marque todas as opções:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
3. Clique em **Save**

### 5. Fazer Redeploy

Após adicionar as variáveis, você precisa fazer um novo deploy:

**Opção 1: Redeploy Manual**
1. Vá em **Deployments** (no menu lateral)
2. Encontre o último deployment
3. Clique nos **três pontos** (⋯) ao lado
4. Selecione **Redeploy**
5. Aguarde o deploy concluir

**Opção 2: Novo Commit (Recomendado)**
1. Faça qualquer pequena alteração (ou apenas um commit vazio)
2. Faça push para o GitHub
3. O Vercel fará deploy automaticamente

### 6. Verificar se Funcionou

1. Acesse seu site no Vercel
2. Tente criar um salário
3. O erro deve desaparecer

## ⚠️ Importante

- As variáveis de ambiente são **sensíveis** - não compartilhe publicamente
- Após adicionar as variáveis, **sempre faça um redeploy**
- As variáveis só ficam ativas após o redeploy

## 🔍 Verificando se as Variáveis Estão Configuradas

1. Vá em **Settings** → **Environment Variables**
2. Você deve ver:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Se ambas estiverem lá, está configurado corretamente!

## 📝 Próximo Passo

Depois de configurar no Vercel, execute também o SQL no Supabase:
- Execute o arquivo `supabase/fix_database.sql` no SQL Editor do Supabase

