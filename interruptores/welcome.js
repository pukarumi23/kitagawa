import chalk from 'chalk';

// ─────────────────────────────────────────────────────────────
//  Variables disponibles en los templates:
//   {usuario}  →  @mención del número
//   {phone}    →  número sin dominio
//   {grupo}    →  nombre del grupo
//   {miembros} →  cantidad de miembros
// ─────────────────────────────────────────────────────────────

export const DEFAULT_WELCOME = `╭━━━🎀━━━🧵━━━🎀━━━╮
┃  🎭 *¡¡ Kyaaa, llegó alguien nuevo !!* 🎭
╰━━━🎀━━━🧵━━━🎀━━━╯
│
├◦ 🎀 *Usuario* ⟶ {usuario}
├◦ 🧵 *Grupo* ⟶ {grupo}
├◦ 🎭 *Miembros* ⟶ ¡Ya somos {miembros} nakamas!
│
├━━━━━━━━━━━━━━━━━━╮
│ 👘 Usa */menu* para ver los comandos~
│ 🪡 ¡Espero que te la pases genial aquí!
│ ✨ ¡Siéntete libre como en Akihabara~! 🎌
╰━━━🎀━━━🧵━━━🎀━━━╯`;

export const DEFAULT_GOODBYE = `╭━━━🎀━━━🧵━━━🎀━━━╮
┃  🎭 *¡¡ Nooo, se va un nakama !!* 😢
╰━━━🎀━━━🧵━━━🎀━━━╯
│
├◦ 🎀 *Usuario* ⟶ {usuario}
├◦ 🧵 *Grupo* ⟶ {grupo}
├◦ 🎭 *Miembros* ⟶ Ahora somos {miembros}...
│
├━━━━━━━━━━━━━━━━━━╮
│ 👘 Fue genial tenerte aquí, de verdad~
│ 🪡 ¡Como diría Shizuku: "Hasta la vista"! 🎌
│ ✨ ¡Vuelve cuando quieras, okay~! 🎀
╰━━━🎀━━━🧵━━━🎀━━━╯`;

// ─────────────────────────────────────────────────────────────
//  Reemplaza variables del template con los datos reales
// ─────────────────────────────────────────────────────────────
export function buildMessage(template, { phone, groupName, memberCount }) {
  return template
    .replace(/{usuario}/g,  `@${phone}`)
    .replace(/{phone}/g,    phone)
    .replace(/{grupo}/g,    groupName)
    .replace(/{miembros}/g, memberCount);
}

// ─────────────────────────────────────────────────────────────
//  Handler principal — llamado desde enable.js
// ─────────────────────────────────────────────────────────────
export default async function welcomeHandler(client) {
  if (!client?.ev) {
    console.log(chalk.red('[ WELCOME ] Cliente no válido'));
    return;
  }

  client.ev.on('group-participants.update', async (anu) => {
    try {
      if (!anu?.id || !Array.isArray(anu.participants)) return;

      // ── Verificar conexión activa ─────────────────────
      if (client.ws?.socket?.readyState !== 1) return;

      // ── Config del grupo desde la DB ──────────────────
      const groupCfg = global.db.data.chats?.[anu.id] || {};

      const isAdd     = anu.action === 'add';
      const isRemove  = anu.action === 'remove' || anu.action === 'leave';

      if (isAdd    && !groupCfg.welcome) return;
      if (isRemove && !groupCfg.goodbye) return;

      // ── Metadatos del grupo (con timeout 3s) ──────────
      let metadata = { subject: 'Grupo', participants: [] };
      try {
        metadata = await Promise.race([
          client.groupMetadata(anu.id),
          new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 3000))
        ]);
      } catch {}

      const rawCount    = metadata.participants?.length || 0;
      const botId       = client.user.id.split(':')[0] + '@s.whatsapp.net';
      const botSettings = global.db.data.settings?.[botId] || {};

      // ── Procesar cada participante ────────────────────
      for (const jid of anu.participants) {

        // Normalizar JID
        let validJid = jid;
        if (typeof jid === 'object' && jid !== null) validJid = jid.phoneNumber || jid.id || jid;
        if (typeof validJid === 'number')             validJid = `${validJid}@s.whatsapp.net`;
        if (typeof validJid === 'string' && !validJid.includes('@')) validJid += '@s.whatsapp.net';
        if (!validJid || typeof validJid !== 'string' || !validJid.includes('@')) continue;

        // Ignorar al propio bot
        if (validJid === botId) continue;

        const phone = validJid.split('@')[0];

        // Ajuste de conteo según la acción
        const memberCount = isAdd
          ? rawCount                              // ya fue añadido
          : rawCount + anu.participants.length;   // ya salió, compensar

        // ── Foto de perfil ────────────────────────────
        const defaultPp = 'https://i.pinimg.com/webp80/1200x/f0/29/2d/f0292db30d91796e458d472405c4874d.webp';
        let pp = defaultPp;
        try {
          pp = await client.profilePictureUrl(validJid, 'image');
        } catch {
          try { pp = await client.profilePictureUrl(anu.id, 'image'); } catch {}
        }

        // ── contextInfo ───────────────────────────────
        const contextInfo = {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid:   botSettings.id     || '120363425300401364@newsletter',
            serverMessageId: '0',
            newsletterName:  botSettings.nameid || '𝗞𝗜𝗧𝗔𝗚𝗔𝗪𝗔 𝗖𝗛𝗔𝗡𝗘𝗟🌸🌿'
          },
          externalAdReply: {
            title:                botSettings.namebot || 'KITAGAWA',
            body:                 global.dev          || '© 🄿🄾🅆🄴🅁🄴🄳 by chaski',
            previewType:          'PHOTO',
            thumbnailUrl:         botSettings.icon   || 'https://static.wikia.nocookie.net/sono-bisque-doll-wa-koi-wo-suru/images/3/3c/Kitagawa_Marin_~_Anime.jpg',
            sourceUrl:            botSettings.link   || 'https://whatsapp.com/channel/0029VbC04aQ6mYPDkbiMte0u',
            mediaType:            1,
            renderLargerThumbnail: false
          },
          mentionedJid: [validJid]
        };

        const templateData = { phone, groupName: metadata.subject || 'Grupo', memberCount };

        // ── Enviar bienvenida ─────────────────────────
        if (isAdd) {
          const caption = buildMessage(groupCfg.welcomeMsg || DEFAULT_WELCOME, templateData);
          try {
            await client.sendMessage(anu.id, { image: { url: pp }, caption, contextInfo });
            console.log(chalk.green(`[ WELCOME ] Bienvenida → ${phone} en "${metadata.subject}"`));
          } catch (err) {
            if (!err.message?.includes('Connection') && !err.message?.includes('Timeout')) {
              console.log(chalk.yellow(`[ WELCOME ] Error bienvenida → ${err.message}`));
            }
          }
        }

        // ── Enviar despedida ──────────────────────────
        if (isRemove) {
          const caption = buildMessage(groupCfg.goodbyeMsg || DEFAULT_GOODBYE, templateData);
          try {
            await client.sendMessage(anu.id, { image: { url: pp }, caption, contextInfo });
            console.log(chalk.blue(`[ WELCOME ] Despedida → ${phone} en "${metadata.subject}"`));
          } catch (err) {
            if (!err.message?.includes('Connection') && !err.message?.includes('Timeout')) {
              console.log(chalk.yellow(`[ WELCOME ] Error despedida → ${err.message}`));
            }
          }
        }

        // Delay anti-spam entre participantes
        await new Promise(r => setTimeout(r, 1500));
      }

    } catch (err) {
      if (!err.message?.includes('Connection Closed') && !err.message?.includes('Timeout')) {
        console.log(chalk.gray(`[ WELCOME ] Error → ${err.message}`));
      }
    }
  });
}
