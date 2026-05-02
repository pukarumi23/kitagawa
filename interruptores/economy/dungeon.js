export default {
  command: ['dungeon', 'mazmorra'],
  category: 'rpg',
  run: async (client, m, args, usedPrefix) => {
    const chat = global.db.data.chats[m.chat]
    const user = chat.users[m.sender]
    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
    const currency = global.db.data.settings[botId].currency
    if (chat.adminonly || !chat.economy) 
      return m.reply(`✨ ¡Kyaa! Los comandos de *Economía* están desactivados en este grupo, qué pena~\n\n¡Pero un *administrador* puede activarlos, ve a pedírselo!\n» *${usedPrefix}economy on*`, m, global.miku)   
    user.lastdungeon ||= 0
    if (user.coins == null) user.coins = 0
    if (user.health == null) user.health = 100
    if (user.health < 5) 
      return m.reply(`💗 ¡Ehh! Estás muy lastimada para volver a la *mazmorra*... ¡Cúrate primero, no seas temeraria~!\n> Usa *"${usedPrefix}heal"* para recuperarte.`, m, global.miku)
    if (Date.now() < user.lastdungeon) {
      const restante = user.lastdungeon - Date.now()
      return m.reply(`🌸 ¡Todavía necesitas descansar *${msToTime(restante)}* antes de volver a la mazmorra~! ¡El cuerpo también importa, okay!`, m, global.miku)
    }
    const rand = Math.random()
    let cantidad = 0
    let salud = Math.floor(Math.random() * (18 - 10 + 1)) + 10
    let message
    if (rand < 0.4) {
      cantidad = Math.floor(Math.random() * (15000 - 12000 + 1)) + 12000
      user.coins ||= 0
      user.coins += cantidad
      user.health -= salud
      const successMessages = [
        `💗 ¡¡Sugoi~!! Derrotaste al guardián de las ruinas con un solo golpe y reclamaste el tesoro antiguo, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! ✨`,
        `🌸 ¡Yatta~! Descifraste los símbolos mágicos como toda una heroína y obtuviste recompensas ocultas, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! 💗`,
        `✨ ¡Kyaa~! El sabio de la mazmorra quedó tan impresionado contigo que te premió por tu inteligencia, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! 🌸`,
        `💗 ¡Uwaaah~! El espíritu de la reina ancestral te bendijo con una gema brillante de poder, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! ✨`,
        `🌸 ¡Increíble~! Superaste la prueba de los espejos oscuros sin pestañear y recibiste un artefacto único, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! 💗`,
        `✨ ¡Sugoi sugoi~! Derrotaste a un gólem de obsidiana y desbloqueaste un acceso secreto épico, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! 🌸`,
        `💗 ¡Qué ternura~! Salvaste a un grupo de exploradores perdidos y ellos te recompensaron con todo su corazón, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! ✨`,
        `🌸 ¡Waaah~! Conseguiste abrir la puerta del juicio que nadie más pudo y extrajiste un orbe milenario, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! 💗`,
        `✨ ¡Yatta yatta~! Triunfaste sobre un demonio ilusorio que custodiaba el sello perdido, ¡eres tan fuerte~! ¡ganaste *${cantidad.toLocaleString()} ${currency}*! 🌸`,
        `💗 ¡Kyaa~! Purificaste el altar corrompido con tu energía y recibiste una bendición ancestral poderosa, ¡ganaste *${cantidad.toLocaleString()} ${currency}*! ✨`
      ]
      message = pickRandom(successMessages)
    } else if (rand < 0.7) {
      cantidad = Math.floor(Math.random() * (9000 - 7500 + 1)) + 7500
      user.coins ||= 0
      user.bank ||= 0
      const total = user.coins + user.bank
      if (total >= cantidad) {
        if (user.coins >= cantidad) {
          user.coins -= cantidad
        } else {
          const restante = cantidad - user.coins
          user.coins = 0
          user.bank -= restante
        }
      } else {
        cantidad = total
        user.coins = 0
        user.bank = 0
      }
      user.health -= salud
      if (user.health < 0) user.health = 0
      const failMessages = [
        `💔 ¡Ehh~! El guardián te atacó sin previo aviso y te hirió gravemente... ¡Qué susto tan horrible!, perdiste *${cantidad.toLocaleString()} ${currency}* 😭`,
        `🌸 ¡Kyaa~! Las paredes se cerraron de repente y quedaste atrapada sin poder escapar, perdiste *${cantidad.toLocaleString()} ${currency}*... ¡La próxima vez ten más cuidado! 💔`,
        `💔 ¡Uwaaah~! El suelo se abrió bajo tus pies y cayeron garras afiladas de la nada, perdiste *${cantidad.toLocaleString()} ${currency}*... ¡Qué mazmorra tan traicionera! 😭`,
        `🌸 ¡Nooo~! Una trampa falsa se activó justo cuando ibas ganando y te lanzó por un acantilado, perdiste *${cantidad.toLocaleString()} ${currency}* 💔`,
        `💔 ¡Ehh ehh~! El aire se volvió tóxico de repente y comenzaste a ahogarte sin poder hacer nada, perdiste *${cantidad.toLocaleString()} ${currency}*... ¡Cuídate más! 😭`,
        `🌸 ¡Kyaa~! Un falso tesoro super brillante te engañó completamente y desapareció al tocarlo, perdiste *${cantidad.toLocaleString()} ${currency}* 💔`,
        `💔 ¡Nooo~! El guardián te encontró y te persiguió por todos los pasillos oscuros sin descanso, perdiste *${cantidad.toLocaleString()} ${currency}*... ¡Tan injusto~! 😭`,
        `🌸 ¡Uwaaah~! Las runas mágicas se activaron solas y te teletransportaron directo a una jaula, perdiste *${cantidad.toLocaleString()} ${currency}* 💔`,
        `💔 ¡Kyaa~! Una gárgola enorme te mordió las piernas y te arrastró a las profundidades oscuras, perdiste *${cantidad.toLocaleString()} ${currency}*... ¡Eso debió doler muchísimo~! 😭`,
        `🌸 ¡Ehh~! El alma del laberinto te absorbió y casi te vuelve loca de tanto miedo, perdiste *${cantidad.toLocaleString()} ${currency}* 💔`,
        `💔 ¡Nooo~! Un espectro espeluznante te poseyó y comenzó a alimentarse de todo tu miedo, perdiste *${cantidad.toLocaleString()} ${currency}*... ¡Recuperate pronto~! 😭`,
        `🌸 ¡Kyaa kyaa~! Los susurros en las paredes te contaron secretos tan oscuros que te helaron por completo, perdiste *${cantidad.toLocaleString()} ${currency}* 💔`
      ]
      message = pickRandom(failMessages)
    } else {
      const neutralMessages = [
        `✨ Exploras unas ruinas antiguas misteriosas y aprendes secretos ocultos que nadie más conoce... ¡Qué interesante~!`,
        `🌸 Sigues la pista de un espectro brillante pero desaparece entre la niebla justo cuando lo ibas a alcanzar. ¡Qué frustrante~!`,
        `✨ Acompañas a una princesa elegante por los desiertos de Thaloria sin ningún contratiempo. ¡Fue un paseo tranquilo~!`,
        `🌸 Recorres un bosque encantado lleno de luces mágicas y descubres nuevas rutas secretas. ¡Tan bonito~!`,
        `✨ Visitas una aldea remota encantadora y escuchas relatos emocionantes de viejas batallas épicas. ¡Sugoi~!`
      ]
      message = pickRandom(neutralMessages)
    }
    user.lastdungeon = Date.now() + 20 * 60 * 1000
    await client.sendMessage(m.chat, { text: `🌸 ${global.miku || 'HATSUNE MIKU'} ${message}` }, { quoted: m })
  },
}

function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60)
  const minutes = Math.floor((duration / (1000 * 60)) % 60)
  const min = minutes < 10 ? '0' + minutes : minutes
  const sec = seconds < 10 ? '0' + seconds : seconds
  return min === '00' ? `${sec} segundo${sec > 1 ? 's' : ''}` : `${min} minuto${min > 1 ? 's' : ''}, ${sec} segundo${sec > 1 ? 's' : ''}`
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}
