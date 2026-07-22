import { asyncHandler } from '../middleware/asyncHandler.js'
import { aboutService } from '../services/aboutService.js'
import { failure } from '../utils/response.js'

export const aboutController = {
  get: asyncHandler(async (req, res) => {
    const item = await aboutService.getAbout()
    res.json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const file = req.file
    const data = {}
    if (req.body.story !== undefined) data.story = req.body.story
    if (req.body.companyDescription !== undefined) data.companyDesc = req.body.companyDescription
    if (req.body.mission !== undefined) data.mission = req.body.mission
    if (req.body.vision !== undefined) data.vision = req.body.vision
    if (req.body.location !== undefined) data.location = req.body.location
    if (req.body.contactEmail !== undefined) data.contactEmail = req.body.contactEmail
    if (req.body.socials !== undefined) {
      try {
        data.socials = typeof req.body.socials === 'string' ? req.body.socials : JSON.stringify(req.body.socials)
      } catch {
        data.socials = '{}'
      }
    }
    const item = await aboutService.createOrUpdateAbout(data, file)
    res.json({ success: true, data: item })
  }),
}
