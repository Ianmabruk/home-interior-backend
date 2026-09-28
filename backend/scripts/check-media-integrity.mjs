#!/usr/bin/env node
// Media integrity check for the HOK Interiors database.
//
// HOK stores all production images and videos in Cloudinary and keeps only the
// URL (plus public_id) in PostgreSQL. That means a database problem can never
// delete an image -- the assets are Cloudinary's. But the reverse risk is real:
// a row can point at a URL that no longer resolves, and the page then shows a
// broken image.
//
// This script reads every media reference in the database and asks Cloudinary
// whether it still serves it. It reports broken, redirected and missing assets.
//
//   DATABASE_URL=... node scripts/check-media-integrity.mjs
//
// Read-only. Options:
//   --sample=200   only check up to N URLs per table (default: all)
//   --json         machine-readable output

import { PrismaClient } from '@prisma/client'

const SAMPLE = Number((process.argv.find((a) => a.startsWith('--sample=')) || '').split('=')[1] || 0)
const AS_JSON = process.argv.includes('--json')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}
if (!/^postgres(ql)?:\/\//.test(DATABASE_URL)) {
  console.error('DATABASE_URL must be a postgresql:// URL')
  process.exit(1)
}

// Every column across the schema that can hold a media reference.
const MEDIA_COLUMNS = [
  ['portfolios', 'image_url'],
  ['portfolios', 'cloudinary_id'],
  ['portfolios', 'homepage_circular_image'],
  ['portfolio_images', 'image_url'],
  ['services', 'image_url'],
  ['services', 'homepage_circular_image'],
  ['products', 'main_image'],
  ['blogs', 'image'],
  ['blogs', 'video'],
  ['blogs', 'homepage_circular_image'],
  ['testimonials', 'photo_url'],
  ['social_items', 'image_url'],
  ['hero_media', 'image_url'],
  ['abouts', 'image_url'],
  ['abouts', 'social_image'],
  ['abouts', 'homepage_circular_image'],
  ['about_images', 'image_url'],
  ['circular_tabs', 'image_url'],
  ['virtual_designs', 'image_url'],
  ['work_with_us', 'image_url'],
  // Normalized media child tables exist on the MySQL schema; harmless if absent
  // on PostgreSQL, where these checks are skipped.
  ['product_images', 'url'],
  ['blog_media', 'url'],
  ['virtual_design_media', 'url'],
  ['hero_media_items', 'url'],
  ['work_with_us_media', 'url'],
]

const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v.trim())

async function main() {
  // Uses the application's Prisma client; no extra driver dependency needed.
  const client = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } })
  const q = (sql, ...params) => client.$queryRawUnsafe(sql, ...params)

  const found = []      // { table, column, id, value }
  const skippedTables = []
  let localRefs = 0

  for (const [table, column] of MEDIA_COLUMNS) {
    const exists = await q(
      "SELECT COUNT(*)::int AS c FROM information_schema.tables WHERE table_schema='public' AND table_name=$1",
      table,
    ).catch(() => null)
    const tableExists = (exists?.[0]?.c ?? 0) > 0
    if (!tableExists) {
      if (/_(media|images|items)$/.test(table)) skippedTables.push(table)
      continue
    }

    const cols = await q(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1
          AND column_name IN ('id','portfolio_project_id','blog_id','virtual_design_id','hero_media_id','work_with_us_id')
        ORDER BY (column_name='id') DESC LIMIT 1`,
      table,
    ).catch(() => [])
    const idCol = cols?.[0]?.column_name || null

    const sql = `SELECT ${idCol ? `"${idCol}", ` : ''}"${column}" AS v FROM "${table}"
                 WHERE "${column}" IS NOT NULL AND "${column}" <> ''`
                + (SAMPLE ? ` LIMIT ${SAMPLE}` : '')
    const res = await q(sql).catch(() => [])

    for (const row of res) {
      const v = row.v
      const values = Array.isArray(v) ? v : [v]
      for (const value of values) {
        if (!isUrl(value)) {
          if (typeof value === 'string' && value.trim().startsWith('/uploads/')) localRefs++
          continue
        }
        found.push({ table, column, id: row[idCol] ?? null, value: value.trim() })
      }
    }
  }

  await client.$disconnect()

  // Deduplicate identical URLs, but remember every place they are referenced.
  const byUrl = new Map()
  for (const ref of found) {
    if (!byUrl.has(ref.value)) byUrl.set(ref.value, [])
    byUrl.get(ref.value).push(ref)
  }

  const report = {
    totalReferences: found.length,
    uniqueUrls: byUrl.size,
    localDiskReferences: localRefs,
    checked: 0,
    ok: 0,
    broken: [],
    skippedTables,
  }

  const urls = [...byUrl.keys()]
  const CONCURRENCY = 12
  let index = 0

  async function worker() {
    while (index < urls.length) {
      const url = urls[index++]
      try {
        const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, redirect: 'follow' })
        report.checked++
        const ct = res.headers.get('content-type') || ''
        if (res.ok) {
          report.ok++
          if (!/^(image|video|application)\//.test(ct) && !ct.startsWith('image/') && !ct.startsWith('video/')) {
            report.broken.push({ url, status: res.status, reason: `unexpected content-type: ${ct}`, refs: byUrl.get(url).length })
          }
        } else {
          report.broken.push({ url, status: res.status, reason: res.statusText, refs: byUrl.get(url).length })
        }
      } catch (err) {
        report.checked++
        report.broken.push({ url, status: 0, reason: String(err.message).slice(0, 120), refs: byUrl.get(url).length })
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  if (AS_JSON) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log('=== HOK media integrity check ===\n')
    console.log(`Media references found : ${report.totalReferences}`)
    console.log(`Unique URLs           : ${report.uniqueUrls}`)
    console.log(`Local /uploads/ refs  : ${report.localDiskReferences}`)
    console.log(`Checked               : ${report.checked}`)
    console.log(`Reachable             : ${report.ok}`)
    console.log(`Broken                : ${report.broken.length}`)
    if (report.skippedTables.length) {
      console.log(`\n(child tables not present on this database: ${report.skippedTables.join(', ')})`)
    }
    if (report.localDiskReferences > 0) {
      console.log(
        `\nWARNING: ${report.localDiskReferences} reference(s) point at /uploads/ on local disk,\n` +
        '         not Cloudinary. These will 404 anywhere that file is not deployed.',
      )
    }
    if (report.broken.length) {
      console.log('\n--- broken media ---')
      for (const b of report.broken) {
        console.log(`  [${b.status}] ${b.reason}  (${b.refs} row reference(s))`)
        console.log(`        ${b.url}`)
      }
    } else {
      console.log('\nAll media references resolve. No images or videos are missing.')
    }
  }

  // Non-zero exit when something is actually broken, so it can gate a deploy.
  process.exit(report.broken.length > 0 || report.localDiskReferences > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('media check failed:', e.message)
  process.exit(2)
})
