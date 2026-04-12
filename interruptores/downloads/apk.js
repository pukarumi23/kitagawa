import { search, download } from 'aptoide-scraper'
import { getBuffer } from "../../lib/message.js"

// 💕 Bordes elaborados con figuras - ESTILO CHASKI GÓTICO MARIN 💕
const topBorders = [
  '💕 ── ♡ APTOIDE ♡ ── 💕',
  '✦ ─── 💗 ─── ✦',
  '🦋 ── ✨ DESCARGA ✨ ── 🦋',
  '👑 ─────────────── 👑',
  '🎀 ── 💓 ─── 🎀',
  '⭐ ───────────── ⭐',
  '💖 ── 🌸 ─── 💖',
]

const bottomBorders = [
  '💕 ── ♡ ♡ ♡ ── 💕',
  '✦ ─── 💗 ─── ✦',
  '🦋 ── ✨ ✨ ✨ ── 🦋',
  '👑 ─────────────── 👑',
  '🎀 ── 💓 ─── 🎀',
  '⭐ ───────────── ⭐',
  '💖 ── 🌸 ─── 💖',
]

function getRandomTopBorder() {
  return topBorders[Math.floor(Math.random() * topBorders.length)]
}

function getRandomBottomBorder() {
  return bottomBorders[Math.floor(Math.random() * bottomBorders.length)]
}

export default {
  command: ['apk', 'aptoide', 'apkdl'],
  category: 'download',
  run: async (client, m, args, usedPrefix, command) => {
    if (!args || !args.length) {
      const top = getRandomTopBorder()
      const bottom = getRandomBottomBorder()
      return m.reply(`
${top}

💕 Por favor, ingresa el nombre 
   de la aplicación que deseas.

${bottom}
      `.trim())
    }
    
    await m.react('⏳')
    
    const query = args.join(' ').trim()
    try {
      const searchA = await search(query)
      if (!searchA || searchA.length === 0) {
        await m.react('❌')
        const top = getRandomTopBorder()
        const bottom = getRandomBottomBorder()
        return m.reply(`
${top}

⚠️ No se encontraron resultados 
   para: "${query}"

${bottom}
        `.trim())
      }
      const apkInfo = await download(searchA[0].id)
      if (!apkInfo) {
        await m.react('❌')
        const top = getRandomTopBorder()
        const bottom = getRandomBottomBorder()
        return m.reply(`
${top}

⚠️ No se pudo obtener la información 
   de la aplicación.

${bottom}
        `.trim())
      }
      const { name, package: id, size, icon, dllink: downloadUrl, lastup } = apkInfo
      
      // 💕 DISEÑO GÓTICO ELABORADO MARIN 💕
      const topBorder = getRandomTopBorder()
      const bottomBorder = getRandomBottomBorder()
      const caption = `
${topBorder}

💕 *APTOIDE DOWNLOAD* 💕

✧ Nombre: ${name}
💗 Paquete: ${id}
✧ Actualización: ${lastup}
💗 Tamaño: ${size}

${bottomBorder}
      `.trim()
      
      const sizeBytes = parseSize(size)
      if (sizeBytes > 524288000) {
        await m.react('❌')
        const top = getRandomTopBorder()
        const bottom = getRandomBottomBorder()
        return m.reply(`
${top}

⚠️ El archivo es muy grande (${size})

💕 Descárgalo directamente desde:
${downloadUrl}

${bottom}
        `.trim())
      }
      await client.sendMessage(m.chat, { document: { url: downloadUrl }, mimetype: 'application/vnd.android.package-archive', fileName: `${name}.apk`, caption }, { quoted: m })
      await m.react('✅')
     } catch (e) {
      await m.react('❌')
      const top = getRandomTopBorder()
      const bottom = getRandomBottomBorder()
      await m.reply(`
${top}

⚠️ *ERROR EN LA EJECUCIÓN*

💕 Comando: *${usedPrefix + command}*
✧ Error: ${e.message}

Inténtalo de nuevo o contacta soporte.

${bottom}
      `.trim())
    }
  },
}

function parseSize(sizeStr) {
  if (!sizeStr) return 0
  const parts = sizeStr.trim().toUpperCase().split(' ')
  const value = parseFloat(parts[0])
  const unit = parts[1] || 'B'
  switch (unit) {
    case 'KB': return value * 1024
    case 'MB': return value * 1024 * 1024
    case 'GB': return value * 1024 * 1024 * 1024
    default: return value
  }
}
