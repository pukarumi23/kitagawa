import yts from 'yt-search';
import {getBuffer} from '../../lib/message.js';
export default {
  command: ['ytsearch', 'search'],
  category: 'internet',
  run: async (client, m, args, usedPrefix, command) => {
    if (!args || !args[0]) {
      return m.reply('Ey~ ¿Qué pasa? 😏 Deberías decirme qué video quieres buscar, ¿no? No puedo adivinar tus pensamientos... aunque me gustaría poder hacerlo~ 💕')
    }
    
    await m.react('⏳')
    
    try {
      const ress = await yts(`${args[0]}`)
      const armar = ress.all
      const Ibuff = await getBuffer(armar[0].image)
      let teks2 = armar.map((v) => {
          switch (v.type) {
            case 'video':
              return `✨ *Título:* ${v.title}
🎬 *Duración:* ${v.timestamp}
💫 *Subido hace:* ${v.ago}
👀 *Vistas:* ${v.views}
🔗 *Link:* ${v.url}`.trim()
            case 'channel':
              return `✨ *Canal:* ${v.name}
🔗 *Url:* ${v.url}
💞 *Suscriptores:* ${v.subCountLabel} (${v.subCount})
📹 *Videos:* ${v.videoCount}`.trim()
          }}).filter((v) => v).join('\n\n✨💫✨💫✨💫✨💫✨💫✨💫\n\n')
      
      const caption = `Hm~ 😏 Encontré esto para ti...

${teks2}

¿Te gusta? Espero que encuentres lo que buscabas~ 💕`
      
      await client.sendMessage(m.chat, { image: Ibuff, caption }, { quoted: m })
      await m.react('✅')
    } catch (e) {
      await m.react('❌')
      m.reply(`Ugh... 😤 Algo salió mal

Ocurrió un error al buscar en *${usedPrefix + command}*
💔 *Error:* ${e.message}

¿Qué hago contigo? Inténtalo de nuevo o avísale a alguien que sepa~ 💢`)
    }
  },
};
