export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('[ASYNC_HANDLER]', req.method, req.originalUrl || req.path, err?.message, err?.stack)
    next(err)
  })
}
