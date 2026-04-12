import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  command: ['instagram', 'ig'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command) => {
    if (!args[0] || !args[0].trim()) {
      return m.reply('🌸 Por favor, ingresa un enlace de Instagram.', m, global.miku)
    }
    const url = args[0].trim()
    if (!url.match(/instagram\.com\/(p|reel|share|tv|stories)\//)) {
      return m.reply('🌸 El enlace no parece *válido*. Asegúrate de que sea de *Instagram*.', m, global.miku)
    }
    
    await m.react('⏳')
    
    try {
      const data = await getInstagramMedia(url)
      if (!data) {
        await m.react('❌')
        return m.reply('🌸 No se pudo obtener el contenido.', m, global.miku)
      }
      
      const caption = `🌸✨ *INSTAGRAM DOWNLOAD* ✨🌸
━━━━━━━━━━━━━━━━━━━━
${data.title ? `👤 *Usuario:* ${data.title}\n` : ''}${data.caption ? `💬 *Descripción:* ${data.caption}\n` : ''}${data.like ? `❤️ *Likes:* ${data.like}\n` : ''}${data.comment ? `💭 *Comentarios:* ${data.comment}\n` : ''}${data.views ? `👁️ *Vistas:* ${data.views}\n` : ''}${data.duration ? `⏰ *Duración:* ${data.duration}\n` : ''}${data.resolution ? `🖼️ *Resolución:* ${data.resolution}\n` : ''}${data.format ? `🎀 *Formato:* ${data.format}\n` : ''}🔗 *Enlace:* ${url}
━━━━━━━━━━━━━━━━━━━━
*「 ¡Descarga completada, senpai~! 💕 」*`
      
      const tempFilePath = await downloadFile(data.url, `${Date.now()}_ig.${data.type === 'video' ? 'mp4' : 'jpg'}`)
      
      if (data.type === 'video') {
        await client.sendMessage(m.chat, { 
          video: fs.readFileSync(tempFilePath), 
          caption, 
          mimetype: 'video/mp4', 
          fileName: 'ig.mp4' 
        }, { quoted: m })
      } else if (data.type === 'image') {
        await client.sendMessage(m.chat, { 
          image: fs.readFileSync(tempFilePath), 
          caption 
        }, { quoted: m })
      } else {
        throw new Error('Contenido no soportado.')
      }
      
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
      
      await m.react('✅')
    } catch (e) {
      await m.react('❌')
      await m.reply(`🌸 *ERROR*\n\nOcurrió un error al ejecutar *${usedPrefix + command}*\n💕 *Detalle:* ${e.message}\n\n*「 Intenta de nuevo, senpai~! 」*`, m, global.miku)
    }
  }
}

async function getInstagramMedia(url) {
  const apis = [
    { endpoint: `${global.APIs.stellar.url}/dl/instagram?url=${encodeURIComponent(url)}&key=${global.APIs.stellar.key}`, extractor: res => {
        if (!res.status || !Array.isArray(res.data) || !res.data.length) return null
        const media = res.data[0]
        if (!media?.url) return null
        return { type: media.tipo === 'video' ? 'video' : 'image', title: null, caption: null, resolution: null, format: media.tipo === 'video' ? 'mp4' : 'jpg', url: media.url }
      }
    },
    { endpoint: `${global.APIs.stellar.url}/dl/instagramv2?url=${encodeURIComponent(url)}&key=${global.APIs.stellar.key}`, extractor: res => {
        if (!res.status || !res.data?.url) return null
        const mediaUrl = res.data.mediaUrls?.[0] || res.data.url
        if (!mediaUrl) return null
        return { type: res.data.type === 'video' ? 'video' : 'image', title: res.data.username || null, caption: res.data.caption || null, resolution: null, format: res.data.type === 'video' ? 'mp4' : 'jpg', url: mediaUrl, thumbnail: res.data.thumbnail || null, duration: res.data.videoMeta?.duration ? `${Math.round(res.data.videoMeta.duration)}s` : null }
      }
    },
    { endpoint: `${global.APIs.nekolabs.url}/downloader/instagram?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.success || !res.result?.downloadUrl?.length) return null
        const mediaUrl = res.result.downloadUrl[0]
        if (!mediaUrl) return null
        return { type: res.result.metadata?.isVideo ? 'video' : 'image', title: res.result.metadata?.username || null, caption: res.result.metadata?.caption || null, like: res.result.metadata?.like || null, comment: res.result.metadata?.comment || null, resolution: null, format: res.result.metadata?.isVideo ? 'mp4' : 'jpg', url: mediaUrl }
      }
    },
    { endpoint: `${global.APIs.delirius.url}/download/instagram?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !Array.isArray(res.data) || !res.data.length) return null
        const media = res.data[0]
        if (!media?.url) return null
        return { type: media.type === 'video' ? 'video' : 'image', title: null, caption: null, resolution: null, format: media.type === 'video' ? 'mp4' : 'jpg', url: media.url }
      }
    },
    { endpoint: `${global.APIs.ootaizumi.url}/downloader/instagram/v2?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.result?.url?.length) return null
        const media = res.result.url[0]
        if (!media?.url) return null
        return { type: media.type === 'mp4' ? 'video' : 'image', title: res.result.meta?.username || null, caption: res.result.meta?.title || null, like: res.result.meta?.like_count || null, comment: res.result.meta?.comment_count || null, resolution: null, format: media.ext || null, url: media.url, thumbnail: res.result.thumb || null }
      }
    },
    { endpoint: `${global.APIs.ootaizumi.url}/downloader/instagram/v1?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.result?.media?.length) return null
        const media = res.result.media[0]
        if (!media?.url) return null
        return { type: media.isVideo ? 'video' : 'image', title: res.result.metadata?.author || null, caption: null, like: res.result.metadata?.like || null, views: res.result.metadata?.views || null, duration: res.result.metadata?.duration ? `${Math.round(res.result.metadata.duration)}s` : null, resolution: null, format: media.isVideo ? 'mp4' : 'jpg', url: media.url, thumbnail: res.result.ppc || null }
      }
    }
  ]

  for (const { endpoint, extractor } of apis) {
    try {
      const res = await fetch(endpoint).then(r => r.json())
      const result = extractor(res)
      if (result && result.url) {
        const isValid = await validateUrl(result.url)
        if (isValid) return result
      }
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return null
}

async function validateUrl(url) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

async function downloadFile(url, filename) {
  const tempDir = path.join(__dirname, '../tmp')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  
  const tempFilePath = path.join(tempDir, filename)
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const fileStream = fs.createWriteStream(tempFilePath)
  response.body.pipe(fileStream)
  
  return new Promise((resolve, reject) => {
    fileStream.on('finish', () => resolve(tempFilePath))
    fileStream.on('error', reject)
  })
}
