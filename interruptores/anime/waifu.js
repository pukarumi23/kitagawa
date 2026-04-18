import fetch from 'node-fetch'
export default {
  command: ['waifu', 'neko'],
  category: 'anime',
  run: async (client, m, args, usedPrefix, command, text) => {
    try {
      await m.react('✨')
      let mode = db.data.chats[m.chat]?.nsfw ? 'nsfw' : 'sfw'
      let res = await fetch(`https://api.waifu.pics/${mode}/${command}`)
      if (!res.ok) return
      let json = await res.json()
      if (!json.url) return
      let img = Buffer.from(await (await fetch(json.url)).arrayBuffer())
      await client.sendFile(m.chat, img, 'thumbnail.jpg', `💕 Aquí tienes tu *${command.toUpperCase()}* ฅ^•ﻌ•^ฅ ¡Te lo traigo con amor, cariño~!`, m, global.miku)
      await m.react('💕')
    } catch (e) {
      await m.react('💔')
      await m.reply(`✨ Algo salió mal al ejecutar el comando *${usedPrefix + command}*~ Intenta de nuevo, ¿si? Si el problema persiste, contacta soporte.\n> 🌸 [Error: *${e.message}*]`, m, global.miku)
    }
  },
}
