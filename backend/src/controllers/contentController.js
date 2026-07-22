import { asyncHandler } from '../middleware/asyncHandler.js'
import { homepageService } from '../services/homepageService.js'

export const contentController = {
  homepage: asyncHandler(async (req, res) => {
    const data = await homepageService.getHomepage()
    res.json({ success: true, data })
  }),
}
