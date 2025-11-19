-- Migração para adicionar suporte a VR (Vale Refeição) e atribuição de gastos
-- Execute este script se já executou o schema.sql anteriormente

-- 1. Adicionar 'vr' como opção na tabela salaries
ALTER TABLE salaries 
DROP CONSTRAINT IF EXISTS salaries_person_check;

ALTER TABLE salaries 
ADD CONSTRAINT salaries_person_check 
CHECK (person IN ('person1', 'person2', 'conjunto', 'vr'));

-- 2. Adicionar campo paid_by na tabela expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS paid_by VARCHAR(20) NOT NULL DEFAULT 'conjunto';

ALTER TABLE expenses 
DROP CONSTRAINT IF EXISTS expenses_paid_by_check;

ALTER TABLE expenses 
ADD CONSTRAINT expenses_paid_by_check 
CHECK (paid_by IN ('person1', 'person2', 'vr', 'conjunto'));

-- 3. Criar índice para paid_by
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);

-- 4. Adicionar configuração VR nas configurações do site
INSERT INTO site_config (key, value, label, category, type) VALUES
  ('vr_label', 'Vale Refeição (VR)', 'Rótulo do Vale Refeição', 'people', 'text')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, 
    label = EXCLUDED.label, 
    category = EXCLUDED.category, 
    type = EXCLUDED.type;

