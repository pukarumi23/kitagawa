import fs from 'fs';
export default {
  command: ['fantasmas', 'ghosts', 'inactivos'],
  category: 'group',
  run: async (client, m, args, usedPrefix, command) => {
    if (!m.isGroup) return m.reply('😏 Mmmm, esto solo funciona en grupos, cielo. ¿Qué acaso querías una sesión privada conmigo?', m);
    const groupMetadata = await (global.getGroupMetadata || (async () => await client.groupMetadata(m.chat)))(client, m.chat);
    const participants = groupMetadata.participants;
    const inactiveDays = 30;
    const now = Date.now();
    const inactiveThreshold = now - (inactiveDays * 24 * 60 * 60 * 1000);
    let inactiveUsers = [];
    for (const participant of participants) {
      const jid = participant.id;
      
      if (typeof jid === 'string' && jid.includes(':')) {
        jid = jid.split(':')[0] + '@s.whatsapp.net';
      }
      
      const phone = jid.split('@')[0];
      const userData = global.db.data.users[jid];
      
      if (userData) {
        const lastActivity = userData.lastMessage || userData.lastseen || 0;
        if (lastActivity < inactiveThreshold && !participant.admin) {
          const name = userData.name || participant.notify || `@${phone}`;
          inactiveUsers.push({
            name: name,
            number: phone,
            jid: jid,
            lastActivity: lastActivity,
            daysInactive: Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000))
          });
        }
      }
    }
    if (inactiveUsers.length === 0) {
      return m.reply('😘 Qué pena... no hay nadie durmiendo en este grupo. ¡Todos están aquí para mí! ¿O acaso tú también quieres desaparecer? 💋', m);
    }
    
    inactiveUsers.sort((a, b) => b.daysInactive - a.daysInactive);
    let message = `╔════════════════════════════╗\n`;
    message += `║  💄 LISTA NEGRA DEL GRUPO  ║\n`;
    message += `║ ━━━━━━━━━━━━━━━━━━━━━━━━━━ ║\n`;
    message += `║ 👀 *${groupMetadata.subject}*\n`;
    message += `║ 🚫 Perdedores desaparecidos: *${inactiveUsers.length}*\n`;
    message += `║ ⏰ Sin aparecer en *${inactiveDays} días*\n`;
    message += `╠════════════════════════════╣\n`;
    const mentions = [];
    inactiveUsers.forEach((user, index) => {
      const num = (index + 1).toString().padStart(2, '0');
      message += `║ ${num}. 😴 ${user.name}\n`;
      message += `║    📞 @${user.number}\n`;
      message += `║    👻 *${user.daysInactive} días* desaparecido\n`;
      message += `║\n`;
      mentions.push(user.jid);
    });
    message += `╚════════════════════════════╝\n\n`;
    message += `💋 *¿Y bien?* Usa *${usedPrefix}kick* para deshacerte de estos aburridos.\n`;
    message += `_Solo yo puedo tener ausencias interesantes~_ 😏`;
    client.sendMessage(m.chat, { text: message, mentions }, { quoted: m });
  }
};
