import { showEnableList } from '../enable.js';
export default {
  command: ['enable', 'on', 'disable', 'off'],
  isOwner: true,
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const chat = global.db.data.chats[m.chat];
      const functionToToggle = args[0]?.toLowerCase();
      const isDisableCommand = ['disable', 'off'].includes(command);
      if (!functionToToggle) {
        await showEnableList(client, m);
        return;
      }
      
      const setFeature = (featureName, status, successMessage) => {
        chat[featureName] = status;
        return client.reply(m.chat, successMessage(status), m, global.miku);
      };
     
      const toggleFeature = (featureName, currentStatus, successMessage) => {
        const newStatus = !currentStatus;
        chat[featureName] = newStatus;
        return client.reply(m.chat, successMessage(newStatus), m, global.miku);
      };

      const handleFeature = (featureName, dbField, message) => {
        if (isDisableCommand) {
          return setFeature(dbField, false, (status) => 
            `💔 ¡Uwaaah~! ${message} ha sido *desactivado*. ¡Qué pena~!`
          );
        } else {
          return toggleFeature(dbField, chat[dbField], (status) => 
            `${status ? `✨ ¡Yatta~! ${message} ha sido *activado*. ¡Sugoi~! 💗` : `💔 ¡Ehh~! ${message} ha sido *desactivado*. ¡Qué pena~!`}`
          );
        }
      };

      switch (functionToToggle) {
        case 'antilink':
          await handleFeature('Antilink', 'antilinks', 'Antilink');
          break;
        case 'detect':
          await handleFeature('Detección de mensajes', 'detect', 'Detección de mensajes');
          break;
        case 'antilink2':
          await handleFeature('Antilink avanzado', 'antilink2', 'Antilink avanzado');
          break;
        case 'events':
          await handleFeature('Eventos grupales', 'alerts', 'Eventos grupales');
          break;
        case 'audios':
          {
            const scope = args[1]?.toLowerCase() || 'group'
            const status = isDisableCommand ? false : (scope === 'group' ? !chat.audios : null)
            const botJid = (client.user?.id?.split(':')[0] || client.user?.lid) + '@s.whatsapp.net'
            if (scope === 'global' || scope === 'bot' || scope === 'all') {
              const botSettings = global.db.data.settings[botJid] ||= {}
              if (isDisableCommand) botSettings.audios = false
              else botSettings.audios = !botSettings.audios
              await client.reply(m.chat, `${botSettings.audios ? `✨ ¡Yatta~! Audios del bot (global) han sido *activados*. ¡Sugoi~! 💗` : `💔 ¡Uwaaah~! Audios del bot (global) han sido *desactivados*. ¡Qué pena~!`}`, m, global.miku)
            } else {
              if (isDisableCommand) chat.audios = false
              else chat.audios = status
              await client.reply(m.chat, `${chat.audios ? `✨ ¡Yatta~! Audios en este grupo han sido *activados*. 💗 Usa \`${usedPrefix}enable audios global on\` para cambiar globalmente~!` : `💔 ¡Ehh~! Audios en este grupo han sido *desactivados*. Usa \`${usedPrefix}enable audios global on\` para cambiar globalmente~!`}`, m, global.miku)
            }
          }
          break;
        default:
          await client.reply(m.chat, `🌸 ¡Kyaa~! La función *"${functionToToggle}"* no existe, ¡no la encontré por ningún lado~! Usa \`${usedPrefix}${command}\` para ver la lista de funciones disponibles. 💗`, m, global.miku);
          break;
      }
    } catch (error) {
      console.error('Error en comando enable/disable:', error);
      await client.reply(m.chat, '💔 ¡Uwaaah~! Ocurrió un error al procesar el comando, ¡qué susto tan horrible~! 😭', m, global.miku);
    }
  }
};
