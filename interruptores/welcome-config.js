// interruptores/welcome-config.js

const VARIABLES_INFO = `*📋 Variables disponibles:*
├ {usuario}  → @mención del miembro
├ {phone}    → número sin @
├ {grupo}    → nombre del grupo
└ {miembros} → cantidad de miembros

*📝 Ejemplo:*
!mw Hola {usuario} 👋\\nBienvenido a {grupo}\\nYa somos {miembros}~

*💡 Usa \\n para saltos de línea*`;

for (const cmd of ['mw', 'modificarwelcome', 'cambiarsaludo']) {
  global.comandos.set(cmd, {
    isAdmin:  true,
    isOwner:  false,
    botAdmin: false,

    async run(client, m, args, usedPrefix, command, text) {
      if (!m.isGroup) return m.reply('❌ Solo funciona en grupos.');

      // Sin texto → mostrar ayuda
      if (!text) {
        return m.reply(
          `*🎀 Modificar mensaje de bienvenida*\n\n` +
          `*Uso:* \`!mw <mensaje>\`\n\n` +
          VARIABLES_INFO
        );
      }

      // Límite de caracteres
      if (text.length > 1000) {
        return m.reply('❌ El mensaje es muy largo. Máximo *1000 caracteres*.');
      }

      // Guardar en la DB (reemplaza \n literal por salto real)
      if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
      global.db.data.chats[m.chat].welcomeMsg = text.replace(/\\n/g, '\n');
      await global.db.write();

      return m.reply('✅ *Mensaje de bienvenida actualizado* 🎀');
    }
  });
}
