import { asyncHandler } from '../middleware/asyncHandler.js'
import { adminOverviewService } from '../services/adminOverviewService.js'

export const adminOverviewController = {
  getStats: asyncHandler(async (req, res) => {
    const stats = await adminOverviewService.getAdminOverview()
    res.json({ success: true, data: stats })
  }),

  getSettings: asyncHandler(async (req, res) => {
    const settings = await adminOverviewService.getSettings()
    res.json({ success: true, data: settings })
  }),

  updateSettings: asyncHandler(async (req, res) => {
    const settings = await adminOverviewService.updateSettings(req.body)
    res.json({ success: true, data: settings })
  }),
}
