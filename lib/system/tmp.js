import fs from 'fs'
import path from 'path'

function toInt(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

export function resolveBotTmpDir() {
  const configured = String(process.env.BOT_TMP_DIR || '').trim()
  return configured ? path.resolve(configured) : path.resolve('./tmp')
}

export async function ensureBotTmpDir(tmpDir = resolveBotTmpDir()) {
  await fs.promises.mkdir(tmpDir, { recursive: true }).catch(() => {})
  return tmpDir
}

async function listTmpFiles(tmpDir) {
  const entries = await fs.promises.readdir(tmpDir, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const ent of entries) {
    if (!ent.isFile()) continue
    const fullPath = path.join(tmpDir, ent.name)
    const stat = await fs.promises.stat(fullPath).catch(() => null)
    if (!stat) continue
    files.push({ fullPath, name: ent.name, size: stat.size || 0, mtimeMs: stat.mtimeMs || 0 })
  }
  return files
}

export async function cleanupBotTmpDir(tmpDir = resolveBotTmpDir(), options = {}) {
  const maxAgeMs = toInt(options.maxAgeMs ?? process.env.BOT_TMP_MAX_AGE_MS, 24 * 60 * 60 * 1000) // 24h
  const maxBytes = toInt(options.maxBytes ?? process.env.BOT_TMP_MAX_BYTES, 250 * 1024 * 1024) // 250MB

  await ensureBotTmpDir(tmpDir)

  const now = Date.now()
  const files = await listTmpFiles(tmpDir)

  let removed = 0
  let freedBytes = 0

 
  for (const f of files) {
    if (maxAgeMs > 0 && now - f.mtimeMs > maxAgeMs) {
      const ok = await fs.promises.unlink(f.fullPath).then(() => true).catch(() => false)
      if (ok) {
        removed++
        freedBytes += f.size
      }
    }
  }

 
  const remaining = await listTmpFiles(tmpDir)
  let total = remaining.reduce((a, b) => a + (b.size || 0), 0)
  if (maxBytes > 0 && total > maxBytes) {
    remaining.sort((a, b) => (a.mtimeMs || 0) - (b.mtimeMs || 0))
    for (const f of remaining) {
      if (total <= maxBytes) break
      const ok = await fs.promises.unlink(f.fullPath).then(() => true).catch(() => false)
      if (ok) {
        removed++
        freedBytes += f.size
        total -= f.size
      }
    }
  }

  return { tmpDir, removed, freedBytes }
}

export function applyTmpEnvIfConfigured(tmpDir = resolveBotTmpDir()) {
  const configured = String(process.env.BOT_TMP_DIR || '').trim()
  const force = String(process.env.FORCE_BOT_TMPDIR || '').toLowerCase() === 'true'
  if (!configured && !force) return null

  process.env.TMPDIR = tmpDir
  process.env.TMP = tmpDir
  process.env.TEMP = tmpDir
  return tmpDir
}

export function startTmpAutoCleanup(tmpDir = resolveBotTmpDir()) {
  const enabled = String(process.env.BOT_TMP_CLEANUP || '').toLowerCase()
  if (enabled === 'false') return null

  const intervalMs = toInt(process.env.BOT_TMP_CLEAN_INTERVAL_MS, 30 * 60 * 1000)
  cleanupBotTmpDir(tmpDir).catch(() => {})
  const t = setInterval(() => cleanupBotTmpDir(tmpDir).catch(() => {}), intervalMs)
  if (typeof t.unref === 'function') t.unref()
  return t
}
