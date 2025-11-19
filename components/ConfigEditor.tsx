'use client'

import { useState, useEffect } from 'react'
import { useConfig } from '@/contexts/ConfigContext'
import { SiteConfig } from '@/lib/supabase'
import { X, Save, Settings } from 'lucide-react'

interface ConfigEditorProps {
  onClose: () => void
}

const categoryLabels: Record<string, string> = {
  general: 'Geral',
  people: 'Pessoas',
  labels: 'Rótulos',
  buttons: 'Botões',
  form: 'Formulário',
  charts: 'Gráficos',
  lists: 'Listas',
  messages: 'Mensagens',
}

export default function ConfigEditor({ onClose }: ConfigEditorProps) {
  const { configsList, updateConfigs, loading } = useConfig()
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const initialEdits: Record<string, string> = {}
    configsList.forEach((config) => {
      initialEdits[config.key] = config.value
    })
    setEdits(initialEdits)
  }, [configsList])

  const handleChange = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(edits)
        .filter(([key, value]) => {
          const original = configsList.find((c) => c.key === key)
          return original && original.value !== value
        })
        .map(([key, value]) => ({ key, value }))

      if (updates.length > 0) {
        await updateConfigs(updates)
        alert('Configurações salvas com sucesso!')
      } else {
        alert('Nenhuma alteração para salvar.')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações. Verifique o console para mais detalhes.')
    } finally {
      setSaving(false)
    }
  }

  const categories = Array.from(new Set(configsList.map((c) => c.category)))
  const filteredConfigs = configsList.filter((config) => {
    const matchesSearch =
      config.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.value.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedByCategory = filteredConfigs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push(config)
    return acc
  }, {} as Record<string, SiteConfig[]>)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Carregando configurações...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Configurações do Site</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Buscar configuração..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat] || cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(groupedByCategory).map(([category, configs]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                {categoryLabels[category] || category}
              </h3>
              <div className="space-y-4">
                {configs.map((config) => (
                  <div key={config.key} className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {config.label}
                    </label>
                    {config.type === 'textarea' ? (
                      <textarea
                        value={edits[config.key] || ''}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    ) : (
                      <input
                        type={config.type === 'number' ? 'number' : 'text'}
                        value={edits[config.key] || ''}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">Chave: {config.key}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredConfigs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma configuração encontrada
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Todas as Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
