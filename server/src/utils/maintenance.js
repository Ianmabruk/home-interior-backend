let cache = { value: false, lastChecked: 0 }
const TTL = 30_000

export const isMaintenanceMode = async (prisma) => {
  const now = Date.now()
  if (now - cache.lastChecked < TTL) return cache.value
  try {
    const settings = await prisma.settings.findFirst({ select: { maintenanceMode: true } })
    cache.value = Boolean(settings?.maintenanceMode)
    cache.lastChecked = now
    return cache.value
  } catch {
    return false
  }
}

export const invalidateMaintenanceCache = () => {
  cache.lastChecked = 0
}
