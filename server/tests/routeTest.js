#!/usr/bin/env node
import http from 'http'

const BASE = 'http://localhost:5000/api'

const routes = [
  { method: 'GET', path: '/health', auth: false },
  { method: 'GET', path: '/homepage', auth: false },
  { method: 'GET', path: '/portfolio', auth: false },
  { method: 'GET', path: '/services', auth: false },
  { method: 'GET', path: '/about', auth: false },
  { method: 'GET', path: '/virtual-designs', auth: false },
  { method: 'GET', path: '/products', auth: false },
  { method: 'GET', path: '/orders', auth: true },
  { method: 'GET', path: '/admin/overview', auth: true },
  { method: 'GET', path: '/admin/settings', auth: true },
  { method: 'GET', path: '/admin/messages', auth: true },
]

function request(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function runTests() {
  let passed = 0
  let failed = 0
  const results = []

  for (const route of routes) {
    try {
      const res = await request(route.method, route.path)
      const isAuthRoute = route.auth
      const isSuccess = res.status === 200 || (isAuthRoute && res.status === 401)

      if (isSuccess) {
        passed++
        results.push(`  PASS ${route.method} ${route.path} (${res.status})`)
      } else {
        failed++
        results.push(`  FAIL ${route.method} ${route.path} (${res.status}) - ${JSON.stringify(res.data).slice(0, 100)}`)
      }
    } catch (err) {
      failed++
      results.push(`  FAIL ${route.method} ${route.path} - ${err.message}`)
    }
  }

  console.log('\n=== API Route Test Results ===\n')
  results.forEach((r) => console.log(r))
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test runner failed:', err)
  process.exit(1)
})
