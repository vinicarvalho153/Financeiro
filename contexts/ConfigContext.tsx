'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SiteConfig } from '@/lib/supabase'
import { getAllConfigs, updateConfigs as updateConfigsDB, getConfig } from '@/lib/configDatabase'

interface ConfigContextType {
  configs: Record<string, string>
  configsList: SiteConfig[]
  loading: boolean
  updateConfig: (key: string, value: string) => Promise<void>
  updateConfigs: (updates: { key: string; value: string }[]) => Promise<void>
  reloadConfigs: () => Promise<void>
  getConfigValue: (key: string) => string
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [configsList, setConfigsList] = useState<SiteConfig[]>([])
  const [loading, setLoading] = useState(true)

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const allConfigs = await getAllConfigs()
      const configsMap: Record<string, string> = {}
      
      allConfigs.forEach((config) => {
        configsMap[config.key] = config.value
      })

      setConfigs(configsMap)
      setConfigsList(allConfigs)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  const updateConfig = async (key: string, value: string) => {
    try {
      await updateConfigsDB([{ key, value }])
      setConfigs((prev) => ({ ...prev, [key]: value }))
      
      // Atualizar também na lista
      setConfigsList((prev) =>
        prev.map((config) => (config.key === key ? { ...config, value } : config))
      )
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
      throw error
    }
  }

  const updateConfigs = async (updates: { key: string; value: string }[]) => {
    try {
      await updateConfigsDB(updates)
      const newConfigs = { ...configs }
      updates.forEach(({ key, value }) => {
        newConfigs[key] = value
      })
      setConfigs(newConfigs)

      // Atualizar também na lista
      setConfigsList((prev) =>
        prev.map((config) => {
          const update = updates.find((u) => u.key === config.key)
          return update ? { ...config, value: update.value } : config
        })
      )
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      throw error
    }
  }

  const getConfigValue = (key: string): string => {
    return configs[key] || ''
  }

  const reloadConfigs = async () => {
    await loadConfigs()
  }

  return (
    <ConfigContext.Provider
      value={{
        configs,
        configsList,
        loading,
        updateConfig,
        updateConfigs,
        reloadConfigs,
        getConfigValue,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error('useConfig deve ser usado dentro de um ConfigProvider')
  }
  return context
}
