import { asyncHandler } from '../middleware/asyncHandler.js'
import { consultationService } from '../services/consultationService.js'
import { failure } from '../utils/response.js'

export const consultationController = {
  publicCreate: asyncHandler(async (req, res) => {
    const data = {
      name: req.body.name || '',
      email: req.body.email || '',
      phone: req.body.phone || '',
      message: req.body.message || '',
      status: 'new',
    }
    const consultation = await consultationService.createConsultation(data)
    res.status(201).json({ success: true, data: consultation })
  }),

  list: asyncHandler(async (req, res) => {
    const { status, search, page = 1, pageSize = 10 } = req.query
    const result = await consultationService.listConsultations({ status, search, page, pageSize })
    res.json({ success: true, data: result })
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const item = await consultationService.updateConsultationStatus(req.params.id, req.body.status)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await consultationService.deleteConsultation(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),

  exportCsv: asyncHandler(async (req, res) => {
    const { status, search } = req.query
    const result = await consultationService.listConsultations({ status, search, page: 1, pageSize: 10000 })

    const headers = 'Name,Email,Phone,Message,Status,Date\n'
    const rows = result.items
      .map((c) =>
        `"${(c.name || '').replace(/"/g, '""')}","${(c.email || '').replace(/"/g, '""')}","${(c.phone || '').replace(/"/g, '""')}","${(c.message || '').replace(/"/g, '""')}","${c.status}","${new Date(c.createdAt).toISOString()}"`,
      )
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="consultations.csv"`)
    res.send(headers + rows)
  }),
}
