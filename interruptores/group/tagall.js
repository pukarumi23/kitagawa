export default {
  command: ['todos', 'invocar', 'tagall'],
  category: 'grupo',
  isAdmin: true,
  run: async (client, m, args) => {
    const groupInfo = await client.groupMetadata(m.chat)
    const participants = groupInfo.participants
    const pesan = args.join(' ')
    let teks =
      `✨💕 ꒰ *MARIN KITAGAWA* ꒱ 💕✨\n` +
      `🎀 Cosplay • *PERSONAJE* • Protagonista 🎀\n\n` +
      `🌸💖 *${pesan || '『 ¡Ehh~ ¡Todos aquí, cariño~! 』'}* 💖🌸\n\n` +
      `🎵 *Miembros Presentes:* ${participants.length} 👥\n` +
      `💕 *Convocado por:* @${m.sender.split('@')[0]} ✨\n\n` +
      `╭✦ ꒰ 💕🎀 *Lista de Usuarios* 🎀💕 ꒱ ✦╮\n`
    for (const mem of participants) {
      teks += `│ ✨💕 @${mem.id.split('@')[0]}\n`
    }
    teks += `╰✦──────────────────✦╯\n` +
      `🌸💖 *¡Te cuento con todos, cariño!* • Marin Mode • ¡Aquí vamos! 💖🌸`
    return client.reply(m.chat, teks, m, { mentions: [m.sender, ...participants.map(p => p.id)] })
  }
}
