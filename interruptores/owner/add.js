import { resolveLidToRealJid } from "../../lib/utils.js"
export default {
  command: ['addcoin', 'addxp'],
  isOwner: true,
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const mentioned = m.mentionedJid
      const who2 = mentioned.length > 0 ? mentioned[0] : (m.quoted ? m.quoted.sender : null)
      const who = await resolveLidToRealJid(who2, client, m.chat)
      const bot = global.db.data.settings[client.user.id.split(':')[0] + '@s.whatsapp.net']
      const currency = bot.currency || '$'     
      if (command === 'addcoin') {
        if (!who) return client.reply(m.chat, '🌸 ¡Kyaa~! Menciona a alguien o cita un mensaje, ¡no puedo adivinar a quién~!', m, global.miku)       
        const coinTxt = args.find(arg => !isNaN(arg) && !arg.includes('@'))
        if (!coinTxt) return client.reply(m.chat, `✨ ¡Ehh~! Ingresa la cantidad que deseas añadir, ¡no me dejes adivinando~!\nEjemplo: !addcoin @usuario 100`, m, global.miku)        
        if (isNaN(coinTxt)) return client.reply(m.chat, '💗 ¡Solo números, por favor~! ¡Las letras no valen aquí!', m, global.miku)       
        await m.react('🕒')
        const dmt = parseInt(coinTxt)
        if (dmt < 1) {
          await m.react('✖️')
          return client.reply(m.chat, '🌸 ¡El mínimo es *1*~! ¡No seas tacaña!', m, global.miku)
        }        
        if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = { users: {} }
        if (!global.db.data.chats[m.chat].users) global.db.data.chats[m.chat].users = {}
        const userData = global.db.data.chats[m.chat].users
        if (!userData[who]) {
          userData[who] = { coins: 0 }
        }       
        userData[who].coins += dmt
        await m.react('✔️')
        return client.reply(m.chat, `💗 *¡Yatta~! Monedas añadidas exitosamente:*\n» ${dmt} ${currency}\n@${who.split('@')[0]}, ¡recibiste ${dmt} ${currency}~! ¡Sugoi! ✨`, m, { mentions: [who] })
      }
      if (command === 'addxp') {
        if (!who) return client.reply(m.chat, '🌸 ¡Kyaa~! Menciona a alguien o cita un mensaje, ¡necesito saber a quién~!', m, global.miku)
        const xpTxt = args.find(arg => !isNaN(arg) && !arg.includes('@'))
        if (!xpTxt) return client.reply(m.chat, '✨ ¡Ehh~! Ingresa la cantidad de experiencia (XP) que deseas añadir, ¡vamos~!\nEjemplo: !addxp @usuario 50', m, global.miku)
        if (isNaN(xpTxt)) return client.reply(m.chat, '💗 ¡Solo se permiten números~! ¡Nada de letras raras por aquí!', m, global.miku)
        await m.react('🕒')
        const xp = parseInt(xpTxt)
        if (xp < 1) {
          await m.react('✖️')
          return client.reply(m.chat, '🌸 ¡El mínimo de experiencia (XP) es *1*~! ¡No seas así!', m, global.miku)
        }
        if (!global.db.data.users) global.db.data.users = {}
        const userData = global.db.data.users
        if (!userData[who]) {
          userData[who] = { exp: 0 }
        }
        userData[who].exp += xp
        await m.react('✔️')
        return client.reply(m.chat, `✨ ¡Sugoi~! XP Añadido: *${xp}*\n@${who.split('@')[0]}, ¡recibiste ${xp} XP~! ¡Sigue así, eres increíble! 💗`, m, { mentions: [who] })
      }
    } catch (error) {
      console.error(error)
      await m.react('✖️')
      return client.reply(m.chat, `💔 ¡Uwaaah~! Algo salió muy mal, ¡qué susto~!\n${error.message}`, m, global.miku)
    }
  }
}
