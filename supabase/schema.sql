-- Criação da tabela de salários
CREATE TABLE IF NOT EXISTS salaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person VARCHAR(20) NOT NULL CHECK (person IN ('person1', 'person2', 'conjunto', 'vr')),
  name VARCHAR(255) NOT NULL,
  value DECIMAL(10, 2) NOT NULL CHECK (value >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhorar a performance das queries
CREATE INDEX IF NOT EXISTS idx_salaries_person ON salaries(person);
CREATE INDEX IF NOT EXISTS idx_salaries_created_at ON salaries(created_at DESC);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o updated_at automaticamente
CREATE TRIGGER update_salaries_updated_at BEFORE UPDATE ON salaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Política RLS (Row Level Security) - permitir todas as operações
-- Em produção, você deve ajustar essas políticas conforme sua necessidade de segurança
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas as operações" ON salaries
FOR ALL
USING (true)
WITH CHECK (true);

-- Criação da tabela de configurações do site
CREATE TABLE IF NOT EXISTS site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  label VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'number', 'textarea')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_site_config_key ON site_config(key);
CREATE INDEX IF NOT EXISTS idx_site_config_category ON site_config(category);

-- Trigger para atualizar o updated_at automaticamente
CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Política RLS (Row Level Security)
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas as operações em site_config" ON site_config
FOR ALL
USING (true)
WITH CHECK (true);

-- Inserir configurações padrão
INSERT INTO site_config (key, value, label, category, type) VALUES
  ('site_title', 'Controle Financeiro', 'Título do Site', 'general', 'text'),
  ('site_subtitle', 'Gestão de salários para duas pessoas', 'Subtítulo do Site', 'general', 'text'),
  ('person1_name', 'Pessoa 1', 'Nome da Pessoa 1', 'people', 'text'),
  ('person2_name', 'Pessoa 2', 'Nome da Pessoa 2', 'people', 'text'),
  ('vr_label', 'Vale Refeição (VR)', 'Rótulo do Vale Refeição', 'people', 'text'),
  ('conjunto_label', 'Salário Conjunto', 'Rótulo do Salário Conjunto', 'people', 'text'),
  ('total_geral_label', 'Total Geral', 'Rótulo do Total Geral', 'labels', 'text'),
  ('total_conjunto_label', 'Salário Conjunto', 'Rótulo do Total Conjunto', 'labels', 'text'),
  ('button_add_salary', 'Adicionar Salário', 'Texto do Botão Adicionar', 'buttons', 'text'),
  ('salary_type_label', 'Tipo de Salário', 'Rótulo do Tipo de Salário', 'form', 'text'),
  ('salary_name_label', 'Nome/Descrição', 'Rótulo do Nome/Descrição', 'form', 'text'),
  ('salary_value_label', 'Valor (R$)', 'Rótulo do Valor', 'form', 'text'),
  ('projection_title', 'Projeção de Salários (Próximos 12 Meses)', 'Título do Gráfico de Projeção', 'charts', 'text'),
  ('salaries_list_title', 'Salários Cadastrados', 'Título da Lista de Salários', 'lists', 'text'),
  ('empty_salaries_message', 'Nenhum salário cadastrado ainda. Clique em "Adicionar Salário" para começar.', 'Mensagem quando não há salários', 'messages', 'textarea'),
  ('empty_projection_message', 'Adicione pelo menos um salário para ver a projeção', 'Mensagem quando não há projeção', 'messages', 'textarea')
ON CONFLICT (key) DO NOTHING;

-- Criação da tabela de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'geral',
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('fixo', 'parcelado', 'unico')),
  paid_by VARCHAR(20) NOT NULL DEFAULT 'conjunto' CHECK (paid_by IN ('person1', 'person2', 'vr', 'conjunto')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  total_installments INT,
  notes TEXT,
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas as operações em expenses" ON expenses
FOR ALL
USING (true)
WITH CHECK (true);

-- Criação da tabela de parcelas
CREATE TABLE IF NOT EXISTS installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installments_expense_id ON installments(expense_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);

CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON installments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas as operações em installments" ON installments
FOR ALL
USING (true)
WITH CHECK (true);

-- Criação da tabela de projeções mensais
CREATE TABLE IF NOT EXISTS projection_monthly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  total DECIMAL(10, 2) DEFAULT 0,
  expenses DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

CREATE INDEX IF NOT EXISTS idx_projection_monthly_year_month ON projection_monthly(year, month);
CREATE INDEX IF NOT EXISTS idx_projection_monthly_year ON projection_monthly(year DESC);

CREATE TRIGGER update_projection_monthly_updated_at BEFORE UPDATE ON projection_monthly
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE projection_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas as operações em projection_monthly" ON projection_monthly
FOR ALL
USING (true)
WITH CHECK (true);
