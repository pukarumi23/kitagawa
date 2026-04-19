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

      // Log de debug
      console.log(chalk.cyan(`✨ Evento detectado: ${anu.action} en ${anu.id}`));

      let metadata = {};
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout obteniendo metadata')), 5000)
        );
        metadata = await Promise.race([
          client.groupMetadata(anu.id),
          timeoutPromise
        ]);
      } catch (err) {
        console.log(chalk.yellow(`⚠️ No se pudo obtener metadata: ${err.message}`));
        metadata = { subject: 'Grupo', participants: [] };
      }

      const participants = anu.participants;
      const memberCount = metadata.participants?.length || 0;
      const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
      const botSettings = global.db.data.settings[botId] || {};
      
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
          console.log(chalk.yellow(`⚠️ JID inválido: ${JSON.stringify(jid)}`));
          continue;
        }
        
        const phone = validJid.split('@')[0];
        
        let pp = 'https://i.pinimg.com/736x/5a/9e/08/5a9e08a474b04a4b4574b9172931aaed.jpg';
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
            newsletterJid: botSettings.id || '120363315369913363@newsletter',
            serverMessageId: '0',
            newsletterName: botSettings.nameid || 'kitagawa bot chanel'
          },
          externalAdReply: {
            title: botSettings.namebot || 'MARIN KITAGAWA',
            body: global.dev || '© 🄿🄾🅆🄴🅁🄴🄳 CHASKI',
            mediaUrl: null,
            description: null,
            previewType: 'PHOTO',
            thumbnailUrl: botSettings.icon || 'https://i.pinimg.com/736x/2b/95/90/2b95906e63e51d846a3a203c07b1c6de.jpg',
            sourceUrl: botSettings.link || 'https://whatsapp.com/channel/0029VbC04aQ6mYPDkbiMte0u',
            mediaType: 1,
            renderLargerThumbnail: false
          },
          mentionedJid: [validJid]
        };
        
        if (anu.action === 'add') {
          try {
            const caption = `╭━━━✨━━━💕━━━✨━━━╮
┃  🎵 *¡ Ehh~ ¡Bienvenid${phone.endsWith('a') ? 'a' : 'o'}! 💕* 🎵
╰━━━✨━━━💕━━━✨━━━╯
│
├◦ ✨ *Usuario* ⟶ @${phone}
├◦ 💕 *Grupo* ⟶ ${metadata.subject || 'Grupo'}
├◦ 🌸 *Miembros* ⟶ Ahora somos ${memberCount}
│
├━━━━━━━━━━━━━━━━━━╮
│ 💖 Usa */menu* para ver comandos.
│ 🌸 ¡Que disfrutes tu estancia, cariño~! ✨
╰━━━✨━━━💕━━━✨━━━╯`;
            
            await client.sendMessage(anu.id, { 
              image: { url: pp }, 
              caption,
              contextInfo
            });
            console.log(chalk.green(`✨💕 Bienvenida enviada a ${phone} en ${metadata.subject}`));
          } catch (err) {
            if (!err.message?.includes('Connection') && !err.message?.includes('Timeout')) {
              console.log(chalk.red(`❌ Welcome: Error enviando bienvenida a ${phone} - ${err.message}`));
            }
          }
        }
        
        if (anu.action === 'remove' || anu.action === 'leave') {
          try {
            const caption = `╭━━━✨━━━💕━━━✨━━━╮
┃  🎵 *¡ Aww~ ¡Hasta luego, cariño! 💕* 🎵
╰━━━✨━━━💕━━━✨━━━╯
│
├◦ ✨ *Usuario* ⟶ @${phone}
├◦ 💕 *Grupo* ⟶ ${metadata.subject || 'Grupo'}
├◦ 🌸 *Miembros* ⟶ Ahora somos ${memberCount}
│
├━━━━━━━━━━━━━━━━━━╮
│ 🌸 Fue un placer tenerte aquí, gatito~
│ 💖 ¡Espero verte de nuevo pronto! ✨
╰━━━✨━━━💕━━━✨━━━╯`;
            
            await client.sendMessage(anu.id, { 
              image: { url: pp }, 
              caption,
              contextInfo
            });
            console.log(chalk.blue(`✨💕 Despedida enviada a ${phone} en ${metadata.subject}`));
          } catch (err) {
            if (!err.message?.includes('Connection') && !err.message?.includes('Timeout')) {
              console.log(chalk.red(`❌ Welcome: Error enviando despedida a ${phone} - ${err.message}`));
            }
          }
        }
      }
    } catch (err) {
      if (!err.message?.includes('Connection Closed') && !err.message?.includes('Timeout')) {
        console.log(chalk.gray(`✨ Welcome Error → ${err.message}`));
      }
    }
  });
}
