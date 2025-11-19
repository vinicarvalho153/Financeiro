-- Script para corrigir o banco de dados e adicionar suporte a VR e paid_by
-- Execute este script no SQL Editor do Supabase

-- 1. Atualizar constraint da tabela salaries para incluir 'vr'
DO $$ 
BEGIN
    -- Remove a constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'salaries_person_check' 
        AND table_name = 'salaries'
    ) THEN
        ALTER TABLE salaries DROP CONSTRAINT salaries_person_check;
    END IF;
    
    -- Adiciona a nova constraint com 'vr'
    ALTER TABLE salaries 
    ADD CONSTRAINT salaries_person_check 
    CHECK (person IN ('person1', 'person2', 'conjunto', 'vr'));
END $$;

-- 2. Adicionar campo paid_by na tabela expenses se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'paid_by'
    ) THEN
        ALTER TABLE expenses 
        ADD COLUMN paid_by VARCHAR(20) NOT NULL DEFAULT 'conjunto';
    END IF;
END $$;

-- 3. Atualizar constraint da tabela expenses para o campo paid_by
DO $$ 
BEGIN
    -- Remove a constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expenses_paid_by_check' 
        AND table_name = 'expenses'
    ) THEN
        ALTER TABLE expenses DROP CONSTRAINT expenses_paid_by_check;
    END IF;
    
    -- Adiciona a nova constraint
    ALTER TABLE expenses 
    ADD CONSTRAINT expenses_paid_by_check 
    CHECK (paid_by IN ('person1', 'person2', 'vr', 'conjunto'));
END $$;

-- 4. Criar índice para paid_by se não existir
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);

-- 5. Adicionar configuração VR nas configurações do site
INSERT INTO site_config (key, value, label, category, type) VALUES
  ('vr_label', 'Vale Refeição (VR)', 'Rótulo do Vale Refeição', 'people', 'text')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, 
    label = EXCLUDED.label, 
    category = EXCLUDED.category, 
    type = EXCLUDED.type;

-- Verificação final
SELECT 
    'Constraint salaries atualizada com sucesso!' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'salaries_person_check' 
    AND table_name = 'salaries'
);

SELECT 
    'Campo paid_by adicionado com sucesso!' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'paid_by'
);

