import fetch from 'node-fetch'

export default {
  command: ['twitter', 'x', 'xdl'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command) => {
    // ✅ Validación de argumentos
    if (!args[0]) {
      return m.reply('💋 ¿En serio? ¿Sin enlace? Pídelo bien, cariño~', m, global.miku)
    }

    // ✅ Validación mejorada de URL
    const urlRegex = /^https?:\/\/(twitter|x)\.com\/\w+\/status\/\d+/i
    if (!urlRegex.test(args[0])) {
      return m.reply('💋 Ese enlace no se ve bien, amor... Asegúrate de que sea de Twitter/X, ¿sí?', m, global.miku)
    }
    
    await m.react('⏳')
    
    try {
      const data = await getTwitterMedia(args[0])
      
      // ✅ Validación completa de datos
      if (!data || !data.url) {
        await m.react('❌')
        return m.reply('💋 Ay, no pude obtener el contenido... Qué pena~', m, global.miku)
      }

      // 🔥 Mensaje con personalidad de Marin Kitagawa
      const caption = crearMensajeMarin(data, args[0])
      
      if (data.type === 'video') {
        await client.sendMessage(m.chat, { 
          video: { url: data.url }, 
          caption, 
          mimetype: 'video/mp4', 
          fileName: 'twitter.mp4' 
        }, { quoted: m })
      } else if (data.type === 'image') {
        await client.sendMessage(m.chat, { 
          image: { url: data.url }, 
          caption 
        }, { quoted: m })
      } else {
        throw new Error('Ese contenido no me interesa, sorry~')
      }
      
      await m.react('✅')
    } catch (e) {
      await m.react('❌')
      await m.reply(`💋 *¡UPS!* 💋

Algo salió mal con *${usedPrefix + command}*...

*Error:* ${e.message}

Intenta de nuevo, ¿sí? Me encantaría ayudarte~ 💕`)
    }
  }
}

/**
 * 🔥 Genera el mensaje con la personalidad de Marin Kitagawa
 */
function crearMensajeMarin(data, url) {
  let mensaje = `💋 *¡Mira lo que te bajé, cariño!* 💋\n\n`

  if (data.title) {
    mensaje += `✨ *Título:* ${data.title}\n`
  }
  
  if (data.author) {
    mensaje += `👤 *De:* ${data.author}\n`
  }
  
  if (data.date) {
    mensaje += `📅 *Fecha:* ${data.date}\n`
  }
  
  if (data.duration) {
    mensaje += `⏱️ *Duración:* ${data.duration}\n`
  }
  
  if (data.resolution) {
    mensaje += `📺 *Calidad:* ${data.resolution}\n`
  }

  // Stats del tweet
  const stats = []
  if (data.views) stats.push(`👀 ${data.views} vistas`)
  if (data.likes) stats.push(`❤️ ${data.likes} likes`)
  if (data.comments) stats.push(`💬 ${data.comments} comentarios`)
  if (data.retweets) stats.push(`🔄 ${data.retweets} retweets`)
  
  if (stats.length > 0) {
    mensaje += `\n📊 *Estadísticas:*\n`
    stats.forEach(stat => mensaje += `   ${stat}\n`)
  }

  mensaje += `\n🔗 *Enlace original:*\n${url}\n\n`
  mensaje += `✨ *Descargado por Marin Kitagawa Bot* ✨\n`
  mensaje += `💕 ¿Te gustó? Vuelve pronto, cariño~ 💕`

  return mensaje
}

/**
 * ✅ Obtiene el contenido multimedia de Twitter/X
 */
async function getTwitterMedia(url) {
  const apis = [
    {
      name: 'Stellar',
      endpoint: `${global.APIs.stellar.url}/dl/twitter?url=${encodeURIComponent(url)}&key=${global.APIs.stellar.key}`,
      extractor: (res) => {
        if (!res?.status || !res?.data?.result?.length) return null
        const media = res.data.result[0]
        return {
          type: res.data.type || 'unknown',
          title: res.data.title || null,
          duration: res.data.duration || null,
          resolution: media.quality || null,
          url: media.url || null,
          thumbnail: res.data.thumbnail || null
        }
      }
    },
    {
      name: 'NekoLabs',
      endpoint: `${global.APIs.nekolabs.url}/downloader/twitter?url=${encodeURIComponent(url)}`,
      extractor: (res) => {
        if (!res?.success || !res?.result?.media?.length) return null
        const media = res.result.media[0]
        const variant = media.variants?.at(-1)
        return {
          type: media.type || 'unknown',
          title: res.result.title || null,
          resolution: variant?.resolution || null,
          url: variant?.url || null,
          thumbnail: media.thumbnail || null
        }
      }
    },
    {
      name: 'Delirius',
      endpoint: `${global.APIs.delirius.url}/download/twitterv2?url=${encodeURIComponent(url)}`,
      extractor: (res) => {
        if (!res?.status || !res?.data?.media?.length) return null
        const media = res.data.media[0]
        const video = media.videos?.at(-1)
        return {
          type: media.type || 'unknown',
          title: res.data.description || null,
          author: res.data.author?.username || null,
          date: res.data.createdAt || null,
          duration: media.duration || null,
          resolution: video?.quality || null,
          url: video?.url || null,
          thumbnail: media.cover || null,
          views: res.data.view || null,
          likes: res.data.favorite || null,
          comments: res.data.replies || null, // ✅ Corregido "replie" -> "replies"
          retweets: res.data.retweet || null
        }
      }
    },
    {
      name: 'SiputZX',
      endpoint: `${global.APIs.siputzx.url}/api/d/twitter?url=${encodeURIComponent(url)}`,
      extractor: (res) => {
        if (!res?.status || !res?.data?.downloadLink) return null
        return {
          type: 'video',
          title: res.data.videoTitle || null,
          url: res.data.downloadLink || null,
          thumbnail: res.data.imgUrl || null
        }
      }
    }
  ]

  // ✅ Timeout global de 20 segundos
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Tiempo límite excedido')), 20000)
  )

  for (const { name, endpoint, extractor } of apis) {
    try {
      const fetchPromise = fetch(endpoint)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })

      const res = await Promise.race([fetchPromise, timeoutPromise])
      
      // ✅ Validación del resultado
      const result = extractor(res)
      if (result?.url) {
        console.log(`✅ Contenido obtenido de: ${name}`)
        return result
      }
    } catch (error) {
      console.error(`❌ Error en ${name}:`, error.message)
    }
    
    // ✅ Espera entre intentos
    await new Promise(r => setTimeout(r, 800))
  }

  return null
}
