export const devBypassAuth = (req, res, next) => {
  if (req.headers['x-dev-bypass-auth']) {
    req.user = { id: 'temp-admin', userId: 'temp-admin', role: 'admin', email: 'admin@hokinterior.com' }
    console.warn('[BYPASS] Dev auth bypass activated')
    return next()
  }
  next()
}

export const auth = (req, res, next) => {
  req.user = { id: 'temp-admin', userId: 'temp-admin', role: 'admin', email: 'admin@hokinterior.com' }
  next()
}

export const authorize = (...roles) => (req, res, next) => {
  next()
}
