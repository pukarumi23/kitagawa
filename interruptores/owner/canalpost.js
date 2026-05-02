export default {
  command: ['canalpost', 'postcanal', 'canalmsg'],
  category: 'owner',
  isOwner: true,
  run: async (client, m, args, usedPrefix, command) => {
    const channelId = '120363425300401364@newsletter'
    const channelName = '𝗞𝗜𝗧𝗔𝗚𝗔𝗪𝗔 𝗖𝗛𝗔𝗡𝗘𝗟🌸🌿'
    
    try {
      let quoted = m.quoted ? m.quoted : m
      let mime = quoted?.msg?.mimetype || quoted?.mediaType || ''
      let texto = args.join(' ')
      
      if (!quoted && !texto) {
        return client.reply(m.chat, `✨ *¡Kyaa~! ¿Cómo usar el comando?*\n\n${usedPrefix}${command} [texto]\n${usedPrefix}${command} [texto] (responde a imagen/video)\n\n🌸 *Ejemplos~:*\n• ${usedPrefix}${command} ¡Hola a todos! 💗\n• ${usedPrefix}${command} Nueva actualización disponible (responde a imagen)\n• ${usedPrefix}${command} Video del día (responde a video)\n\n📺 *Canal destino~:* ${channelName}`, m, global.miku)
      }
      
      await m.react('📤')
      
      try {
        if (quoted && mime.includes('image')) {
          let buffer = await quoted.download()
          await client.sendMessage(channelId, {
            image: buffer,
            caption: texto || `💗 *${channelName}* 💗\n\n📅 ${new Date().toLocaleString('es-MX')}`
          })
        }
        else if (quoted && (mime.includes('video') || mime.includes('mp4'))) {
          let buffer = await quoted.download()
          if (!buffer || buffer.length === 0) {
            return client.reply(m.chat, `💔 ¡Uwaaah~! *No se pudo descargar el video*, ¡qué frustrante~!`, m, global.miku)
          }
          await client.sendMessage(channelId, {
            video: buffer,
            caption: texto || `💗 *${channelName}* 💗\n\n📅 ${new Date().toLocaleString('es-MX')}`
          })
        }
        else if (quoted && mime.includes('audio')) {
          let buffer = await quoted.download()
          if (!buffer || buffer.length === 0) {
            return client.reply(m.chat, `💔 ¡Uwaaah~! *No se pudo descargar el audio*, ¡qué cosa más molesta~!`, m, global.miku)
          }
          await client.sendMessage(channelId, {
            audio: buffer,
            mimetype: 'audio/mp4'
          })
        }
        else {
          await client.sendMessage(channelId, { text: texto })
        }
        
        await m.react('✅')
        client.reply(m.chat, `✨ *¡Yatta~! ¡Enviado al canal exitosamente!*\n\n📺 ${channelName} 💗`, m, global.miku)
        
      } catch (error) {
        await m.react('❌')
        client.reply(m.chat, `💔 ¡Kyaa~! *Algo salió mal~: ${error.message}*\n\n🌸 Verifica que el bot sea admin del canal, ¡eso podría ayudar~!`, m, global.miku)
      }
      
    } catch (error) {
      await m.react('❌')
      client.reply(m.chat, `💔 ¡Uwaaah~! *Error inesperado~: ${error.message}* ¡Qué susto tan horrible!`, m, global.miku)
    }
  }
};
