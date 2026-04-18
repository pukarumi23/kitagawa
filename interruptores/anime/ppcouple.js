import fetch from "node-fetch"
export default {
  command: ['ppcp', 'ppcouple'],
  category: 'anime',
  run: async (client, m, args, usedPrefix, command, text) => {
    try {
      await m.react('✨')
      let data = await (await fetch('https://raw.githubusercontent.com/ShirokamiRyzen/WAbot-DB/main/fitur_db/ppcp.json')).json()
      let cita = data[Math.floor(Math.random() * data.length)]
      let cowi = Buffer.from(await (await fetch(cita.cowo)).arrayBuffer())
      await client.sendFile(m.chat, cowi, '', `💖 ${global.miku || 'HATSUNE MIKU'} *Masculino* ♂`, m)
      let ciwi = Buffer.from(await (await fetch(cita.cewe)).arrayBuffer())
      await client.sendFile(m.chat, ciwi, '', `🌸 ${global.miku || 'HATSUNE MIKU'} *Femenina* ♀`, m)
      await m.react('💕')
    } catch (e) {
      await m.react('💔')
      await m.reply(`✨💕 ${global.miku || 'HATSUNE MIKU'} 🎵 Algo salió mal al ejecutar el comando *${usedPrefix + command}*~ Intenta de nuevo, ¿si? Si el problema persiste, contacta soporte.\n> 🌸 [Error: *${e.message}*]`)
    }
  },
}
