// Lightweight audit logging for privileged mutations. Records who did what
// and when so admin actions (uploads, deletes, content edits) are traceable.
// Errors are intentionally swallowed so logging never breaks a request.
export const auditLog = (req, _res, next) => {
  try {
    const entry = {
      ts: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      user: req.user?.userId || req.user?.id || req.user?.email || 'anonymous',
      role: req.user?.role || 'guest',
      ip: req.ip || req.socket?.remoteAddress || 'unknown',
    }
    // eslint-disable-next-line no-console
    console.log('[AUDIT]', JSON.stringify(entry))
  } catch {
    /* never block the request */
  }
  next()
}

export default auditLog
