import { supabase, SiteConfig, isSupabaseConfigured } from './supabase'

export async function getConfig(key: string): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return getDefaultConfig(key)
  }

  const { data, error } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', key)
    .single()

  if (error || !data) {
    return getDefaultConfig(key)
  }

  return data.value
}

export async function getAllConfigs(): Promise<SiteConfig[]> {
  if (!isSupabaseConfigured) {
    return getDefaultConfigs()
  }

  const { data, error } = await supabase
    .from('site_config')
    .select('*')
    .order('category', { ascending: true })
    .order('label', { ascending: true })

  if (error) {
    console.error('Erro ao buscar configurações:', error)
    return getDefaultConfigs()
  }

  return data as SiteConfig[]
}

export async function updateConfig(key: string, value: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { error } = await supabase
    .from('site_config')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) {
    console.error('Erro ao atualizar configuração:', error)
    throw error
  }
}

export async function updateConfigs(configs: { key: string; value: string }[]): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  for (const config of configs) {
    await updateConfig(config.key, config.value)
  }
}

// Valores padrão quando Supabase não está configurado
function getDefaultConfig(key: string): string | null {
  const defaults: Record<string, string> = {
    site_title: 'Controle Financeiro',
    site_subtitle: 'Gestão de salários para duas pessoas',
    person1_name: 'Pessoa 1',
    person2_name: 'Pessoa 2',
    vr_label: 'Vale Refeição (VR)',
    conjunto_label: 'Salário Conjunto',
    total_geral_label: 'Total Geral',
    total_conjunto_label: 'Salário Conjunto',
    button_add_salary: 'Adicionar Salário',
    salary_type_label: 'Tipo de Salário',
    salary_name_label: 'Nome/Descrição',
    salary_value_label: 'Valor (R$)',
    projection_title: 'Projeção de Salários (Próximos 12 Meses)',
    salaries_list_title: 'Salários Cadastrados',
    empty_salaries_message: 'Nenhum salário cadastrado ainda. Clique em "Adicionar Salário" para começar.',
    empty_projection_message: 'Adicione pelo menos um salário para ver a projeção',
  }
  return defaults[key] || null
}

function getDefaultConfigs(): SiteConfig[] {
  return [
    { id: '1', key: 'site_title', value: 'Controle Financeiro', label: 'Título do Site', category: 'general', type: 'text' },
    { id: '2', key: 'site_subtitle', value: 'Gestão de salários para duas pessoas', label: 'Subtítulo do Site', category: 'general', type: 'text' },
    { id: '3', key: 'person1_name', value: 'Pessoa 1', label: 'Nome da Pessoa 1', category: 'people', type: 'text' },
    { id: '4', key: 'person2_name', value: 'Pessoa 2', label: 'Nome da Pessoa 2', category: 'people', type: 'text' },
    { id: '5', key: 'vr_label', value: 'Vale Refeição (VR)', label: 'Rótulo do Vale Refeição', category: 'people', type: 'text' },
    { id: '16', key: 'conjunto_label', value: 'Salário Conjunto', label: 'Rótulo do Salário Conjunto', category: 'people', type: 'text' },
    { id: '6', key: 'total_geral_label', value: 'Total Geral', label: 'Rótulo do Total Geral', category: 'labels', type: 'text' },
    { id: '7', key: 'total_conjunto_label', value: 'Salário Conjunto', label: 'Rótulo do Total Conjunto', category: 'labels', type: 'text' },
    { id: '8', key: 'button_add_salary', value: 'Adicionar Salário', label: 'Texto do Botão Adicionar', category: 'buttons', type: 'text' },
    { id: '9', key: 'salary_type_label', value: 'Tipo de Salário', label: 'Rótulo do Tipo de Salário', category: 'form', type: 'text' },
    { id: '10', key: 'salary_name_label', value: 'Nome/Descrição', label: 'Rótulo do Nome/Descrição', category: 'form', type: 'text' },
    { id: '11', key: 'salary_value_label', value: 'Valor (R$)', label: 'Rótulo do Valor', category: 'form', type: 'text' },
    { id: '12', key: 'projection_title', value: 'Projeção de Salários (Próximos 12 Meses)', label: 'Título do Gráfico de Projeção', category: 'charts', type: 'text' },
    { id: '13', key: 'salaries_list_title', value: 'Salários Cadastrados', label: 'Título da Lista de Salários', category: 'lists', type: 'text' },
    { id: '14', key: 'empty_salaries_message', value: 'Nenhum salário cadastrado ainda. Clique em "Adicionar Salário" para começar.', label: 'Mensagem quando não há salários', category: 'messages', type: 'textarea' },
    { id: '15', key: 'empty_projection_message', value: 'Adicione pelo menos um salário para ver a projeção', label: 'Mensagem quando não há projeção', category: 'messages', type: 'textarea' },
  ]
}
