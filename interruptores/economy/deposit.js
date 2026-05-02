export default {
  command: ['dep', 'deposit', 'd'],
  category: 'rpg',
  run: async (client, m, args, usedPrefix) => {
    const chatData = global.db.data.chats[m.chat]
    const user = chatData.users[m.sender]
    const idBot = client.user.id.split(':')[0] + '@s.whatsapp.net'
    const settings = global.db.data.settings[idBot]
    const monedas = settings.currency
    if (chatData.adminonly || !chatData.economy) return m.reply(`✨ ¡Kyaa! Los comandos de *Economía* están desactivados en este grupo, qué pena...\n\nPero un *administrador* puede activarlos con el comando, ¡así que ve a pedírselo!\n» *${usedPrefix}economy on*`)
    if (!args[0]) {
      return m.reply(`🌸 ¡Ehh! ¿Cuántos *${monedas}* quieres depositar? ¡No me dejes adivinando~!`)
    }
    if (args[0] < 1 && args[0].toLowerCase() !== 'all') {
      return m.reply('💗 ¡Eso no es una cantidad válida! Ingresa algo real para depositar, anda~')
    }
    if (args[0].toLowerCase() === 'all') {
      if (user.coins <= 0) return m.reply(`🌸 ¡Kyaa! No tienes *${monedas}* para depositar en tu *banco*... ¡Gana más primero!`)
      const count = user.coins
      user.coins = 0
      user.bank += count
      await m.reply(`💗 ¡Sugoi~! Has depositado *🌱${count.toLocaleString()} ${monedas}* en tu Banco. ¡Eres muy responsable, me impresionas! ✨`)
      return true
    }
    if (!Number(args[0]) || parseInt(args[0]) < 1) {
      return m.reply('🌸 ¡Eso no es válido! Ponme un número de verdad, ¡venga~!')
    }
    const count = parseInt(args[0])
    if (user.coins <= 0 || user.coins < count) {
      return m.reply(`💗 ¡Ehh! No tienes suficientes *${monedas}* para depositar... ¡Trabaja más duro, yo sé que puedes! 🌸`)
    }
    user.coins -= count
    user.bank += count
    await m.reply(`✨ ¡Yatta~! Has depositado *🌱${count.toLocaleString()} ${monedas}* en tu Banco. ¡Qué inteligente de tu parte ahorrar así! 💗`)
  },
};
