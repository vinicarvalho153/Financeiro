-- Script para adicionar suporte a gastos únicos (cartões, faturas, etc.)
-- Execute este script no SQL Editor do Supabase

-- 1. Atualizar constraint da tabela expenses para incluir 'unico' no tipo
DO $$ 
BEGIN
    -- Remove a constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expenses_type_check' 
        AND table_name = 'expenses'
    ) THEN
        ALTER TABLE expenses DROP CONSTRAINT expenses_type_check;
    END IF;
    
    -- Adiciona a nova constraint com 'unico'
    ALTER TABLE expenses 
    ADD CONSTRAINT expenses_type_check 
    CHECK (type IN ('fixo', 'parcelado', 'unico'));
END $$;

-- 2. Adicionar campo due_date na tabela expenses se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'due_date'
    ) THEN
        ALTER TABLE expenses 
        ADD COLUMN due_date DATE;
    END IF;
END $$;

-- 3. Criar índice para due_date se não existir
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);

-- Verificação final
SELECT 
    'Constraint type atualizada com sucesso!' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expenses_type_check' 
    AND table_name = 'expenses'
);

SELECT 
    'Campo due_date adicionado com sucesso!' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'due_date'
);

