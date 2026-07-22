import { supabase } from '../config/supabase.js'

let cache = { value: false, lastChecked: 0 }
const TTL = 30_000

export const isMaintenanceMode = async () => {
  const now = Date.now()
  if (now - cache.lastChecked < TTL) return cache.value
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('maintenance_mode')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw new Error(error.message)
    cache.value = Boolean(data?.[0]?.maintenance_mode)
    cache.lastChecked = now
    return cache.value
  } catch {
    return false
  }
}

export const invalidateMaintenanceCache = () => {
  cache.lastChecked = 0
}
