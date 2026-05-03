import chalk from 'chalk';

export default async function welcomeHandler(client) {
  if (!client || !client.ev) {
    console.log(chalk.red('Welcome: Cliente no válido'));
    return;
  }

  client.ev.on('group-participants.update', async (anu) => {
    try {
      
      if (!anu || !anu.id || !anu.participants || !Array.isArray(anu.participants)) {
        return;
      }

      if (client.ws?.socket?.readyState !== 1) {
        return;
      }

      let metadata = {};
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        metadata = await Promise.race([
          client.groupMetadata(anu.id),
          timeoutPromise
        ]);
      } catch (err) {
        metadata = { subject: 'Grupo', participants: [] };
      }

      const participants = anu.participants;
      const memberCount = metadata.participants?.length || 0;
      const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
      const botSettings = global.db.data.settings[botId] || {};
      const groupCfg = global.db.data.chats?.[anu.id] || {};
      
      for (const jid of participants) {
        
        let validJid = jid;
        
        if (typeof jid === 'object' && jid !== null) {
          validJid = jid.phoneNumber || jid.id || jid;
        }
        
        if (typeof validJid === 'number') {
          validJid = `${validJid}@s.whatsapp.net`;
        }
        
        if (typeof validJid === 'string' && !validJid.includes('@')) {
          validJid = `${validJid}@s.whatsapp.net`;
        }
        
        if (!validJid || typeof validJid !== 'string' || !validJid.includes('@')) {
          continue;
        }
        
        const phone = validJid.split('@')[0];
        
        let pp = 'https://i.pinimg.com/webp80/1200x/f0/29/2d/f0292db30d91796e458d472405c4874d.webp';
        try {
          pp = await client.profilePictureUrl(validJid, 'image');
        } catch {
          try {
            pp = await client.profilePictureUrl(anu.id, 'image');
          } catch {}
        }
        
        const contextInfo = {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: botSettings.id || '120363425300401364@newsletter',
            serverMessageId: '0',
            newsletterName: botSettings.nameid || '𝗞𝗜𝗧𝗔𝗚𝗔𝗪𝗔 𝗖𝗛𝗔𝗡𝗘𝗟🌸🌿'
          },
          externalAdReply: {
            title: botSettings.namebot || 'KITAGAWA',
            body: global.dev || '© 🄿🄾🅆🄴🅁🄴🄳 by chaski',
            mediaUrl: null,
            description: null,
            previewType: 'PHOTO',
            thumbnailUrl: botSettings.icon || 'https://static.wikia.nocookie.net/sono-bisque-doll-wa-koi-wo-suru/images/3/3c/Kitagawa_Marin_~_Anime.jpg/revision/latest?cb=20220227174558&path-prefix=es',
            sourceUrl: botSettings.link || 'https://whatsapp.com/channel/0029VbC04aQ6mYPDkbiMte0u',
            mediaType: 1,
            renderLargerThumbnail: false
          },
          mentionedJid: [validJid]
        };
        
        if (anu.action === 'add') {
          try {
            const defaultWelcome = `╭━━━🎀━━━🧵━━━🎀━━━╮
┃  🎭 *¡¡ Kyaaa, llegó alguien nuevo !!* 🎭
╰━━━🎀━━━🧵━━━🎀━━━╯
│
├◦ 🎀 *Usuario* ⟶ @${phone}
├◦ 🧵 *Grupo* ⟶ ${metadata.subject || 'Grupo'}
├◦ 🎭 *Miembros* ⟶ ¡Ya somos ${memberCount} nakamas!
│
├━━━━━━━━━━━━━━━━━━╮
│ 👘 Usa */menu* para ver los comandos~
│ 🪡 ¡Espero que te la pases genial aquí!
│ ✨ ¡Siéntete libre como en Akihabara~! 🎌
╰━━━🎀━━━🧵━━━🎀━━━╯`;

            const caption = groupCfg.welcomeMsg
              ? groupCfg.welcomeMsg
                  .replace(/{usuario}/g,  `@${phone}`)
                  .replace(/{phone}/g,    phone)
                  .replace(/{grupo}/g,    metadata.subject || 'Grupo')
                  .replace(/{miembros}/g, memberCount)
              : defaultWelcome;
            
            await client.sendMessage(anu.id, { 
              image: { url: pp }, 
              caption,
              contextInfo
            });
            console.log(chalk.green(`🎀 Kitagawa: Bienvenida enviada a ${phone}`));
          } catch (err) {
            if (!err.message?.includes('Connection') && !err.message?.includes('Timeout')) {
              console.log(chalk.yellow(`🎀 Kitagawa: Error enviando bienvenida - ${err.message}`));
            }
          }
        }
        
        if (anu.action === 'remove' || anu.action === 'leave') {
          try {
            const caption = `╭━━━🎀━━━🧵━━━🎀━━━╮
┃  🎭 *¡¡ Nooo, se va un nakama !!* 😢
╰━━━🎀━━━🧵━━━🎀━━━╯
│
├◦ 🎀 *Usuario* ⟶ @${phone}
├◦ 🧵 *Grupo* ⟶ ${metadata.subject || 'Grupo'}
├◦ 🎭 *Miembros* ⟶ Ahora somos ${memberCount}...
│
├━━━━━━━━━━━━━━━━━━╮
│ 👘 Fue genial tenerte aquí, de verdad~
│ 🪡 ¡Como diría Shizuku: "Hasta la vista"! 🎌
│ ✨ ¡Vuelve cuando quieras, okay~! 🎀
╰━━━🎀━━━🧵━━━🎀━━━╯`;
            
            await client.sendMessage(anu.id, { 
              image: { url: pp }, 
              caption,
              contextInfo
            });
            console.log(chalk.blue(`🎀 Kitagawa: Despedida enviada a ${phone}`));
          } catch (err) {
            if (!err.message?.includes('Connection') && !err.message?.includes('Timeout')) {
              console.log(chalk.yellow(`🎀 Kitagawa: Error enviando despedida - ${err.message}`));
            }
          }
        }
      }
    } catch (err) {
      if (!err.message?.includes('Connection Closed') && !err.message?.includes('Timeout')) {
        console.log(chalk.gray(`🎀 Kitagawa Error → ${err.message}`));
      }
    }
  });
}
