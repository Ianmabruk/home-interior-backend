import { jest } from '@jest/globals'

export const createChain = () => {
  const chain = {}
  chain.select = jest.fn()
  chain.insert = jest.fn()
  chain.update = jest.fn()
  chain.delete = jest.fn()
  chain.eq = jest.fn()
  chain.neq = jest.fn()
  chain.or = jest.fn()
  chain.order = jest.fn()
  chain.limit = jest.fn()
  chain.range = jest.fn()
  chain.single = jest.fn()
  chain.lt = jest.fn()
  chain.gt = jest.fn()
  chain.in = jest.fn()
  chain.head = jest.fn()

  let resolveWith = { data: [], error: null, count: 0 }
  chain._resolveWith = resolveWith
  chain.setResolveWith = (val) => {
    resolveWith = val
    chain._resolveWith = val
  }

  const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'or', 'order', 'limit', 'range', 'single', 'lt', 'gt', 'in', 'head']
  for (const method of chainMethods) {
    chain[method].mockImplementation(() => chain)
  }

  chain.then = async (onFulfilled, onRejected) => {
    const result = chain._resolveWith
    if (result.error) {
      return Promise.reject(result.error).catch(onRejected)
    }
    return Promise.resolve(result).then(onFulfilled, onRejected)
  }

  return chain
}

export const createMockSupabase = () => {
  const builder = createChain()
  const mock = {
    from: jest.fn(() => builder),
    rpc: jest.fn(() => builder),
    auth: {
      getUser: jest.fn(),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
  }

  return { mock, builder }
}

export const resetMockSupabase = (params) => {
  if (!params) return
  let mock = null
  let builder = null
  if (params.mock && params.builder) {
    mock = params.mock
    builder = params.builder
  } else if (typeof params === 'object' && !Array.isArray(params)) {
    builder = params
  }
  if (!builder) return

  const resetMockFns = (obj) => {
    if (!obj || typeof obj !== 'object') return
    Object.values(obj).forEach((value) => {
      if (typeof value === 'function' && value.mockReset) {
        value.mockReset()
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        resetMockFns(value)
      }
    })
  }

  if (mock) resetMockFns(mock)

  Object.values(builder).forEach((value) => {
    if (typeof value === 'function' && value.mockReset) {
      value.mockReset()
    }
  })

  const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'or', 'order', 'limit', 'range', 'single', 'lt', 'gt', 'in', 'head']
  for (const method of chainMethods) {
    builder[method].mockImplementation(() => builder)
  }

  builder.setResolveWith({ data: [], error: null, count: 0 })
}
