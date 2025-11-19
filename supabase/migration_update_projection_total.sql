-- Migração para alterar coluna 'conjunto' para 'total' na tabela projection_monthly
-- Execute este script se já criou a tabela projection_monthly anteriormente

-- Renomear a coluna 'conjunto' para 'total'
ALTER TABLE projection_monthly 
RENAME COLUMN conjunto TO total;

-- Verificação
SELECT 
    'Coluna renomeada com sucesso!' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projection_monthly' 
    AND column_name = 'total'
);

