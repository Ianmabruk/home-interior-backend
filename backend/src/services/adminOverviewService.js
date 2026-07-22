import { prisma } from '../config/database.js'

export const adminOverviewService = {
  getAdminOverview,
  getSettings,
  updateSettings,
}

export async function getAdminOverview() {
  const [portfolioCount, productCount, orderCount] = await Promise.all([
    prisma.portfolioProject.count(),
    prisma.product.count(),
    prisma.order.count(),
  ])

  return {
    portfolioCount,
    productCount,
    ordersCount: orderCount,
  }
}

export async function getSettings() {
  const settings = await prisma.siteSetting.findMany()
  const result = {}
  for (const s of settings) {
    result[s.key] = s.value
  }
  return {
    siteName: result.siteName || '',
    supportEmail: result.supportEmail || '',
    currency: result.currency || 'USD',
    maintenanceMode: result.maintenanceMode === 'true',
    shippingPolicy: result.shippingPolicy || '',
    returnPolicy: result.returnPolicy || '',
    socialLinks: result.socialLinks || '',
  }
}

export async function updateSettings(data) {
  const entries = []
  for (const [key, value] of Object.entries(data)) {
    entries.push({
      key,
      value: typeof value === 'boolean' ? String(value) : String(value),
    })
  }

  for (const entry of entries) {
    const existing = await prisma.siteSetting.findUnique({
      where: { key: entry.key },
    })
    if (existing) {
      await prisma.siteSetting.update({
        where: { key: entry.key },
        data: { value: entry.value },
      })
    } else {
      await prisma.siteSetting.create({
        data: entry,
      })
    }
  }

  return getSettings()
}
