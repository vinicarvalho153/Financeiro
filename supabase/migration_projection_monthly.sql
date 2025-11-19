-- Migração para adicionar tabela de projeções mensais
-- Execute este script se já executou o schema.sql anteriormente

-- Criação da tabela de projeções mensais
CREATE TABLE IF NOT EXISTS projection_monthly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  conjunto DECIMAL(10, 2) DEFAULT 0,
  expenses DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_projection_monthly_year_month ON projection_monthly(year, month);
CREATE INDEX IF NOT EXISTS idx_projection_monthly_year ON projection_monthly(year DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_projection_monthly_updated_at BEFORE UPDATE ON projection_monthly
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE projection_monthly ENABLE ROW LEVEL SECURITY;

-- Política RLS para permitir todas as operações
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projection_monthly' 
        AND policyname = 'Permitir todas as operações em projection_monthly'
    ) THEN
        CREATE POLICY "Permitir todas as operações em projection_monthly" ON projection_monthly
        FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Verificação final
SELECT 
    'Tabela projection_monthly criada com sucesso!' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'projection_monthly'
);

