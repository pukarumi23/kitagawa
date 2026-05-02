import initDB from '../lib/system/initDB.js';
import welcomeHandler from './welcome.js';

const linkRegex = /(https?:\/\/)?(chat\.whatsapp\.com\/[0-9A-Za-z]{20,24}|whatsapp\.com\/channel\/[0-9A-Za-z]{20,24})/i;
const allowedLinks = ['https://whatsapp.com/channel/0029VbC04aQ6mYPDkbiMte0u'];

async function antilink(client, m) {
  if (!m.isGroup || !m.text) return;
  const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
  if (!groupMetadata) return;
  const participants = groupMetadata.participants || [];
  const groupAdmins = participants.filter(p => p.admin).map(p => p.phoneNumber || p.jid || p.id || p.lid);
  const isAdmin = groupAdmins.includes(m.sender);
  const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = groupAdmins.includes(botId);
  const isSelf = global.db.data.settings[botId]?.self ?? false;
  if (isSelf) return;
  const chat = global?.db?.data?.chats?.[m.chat];
  const primaryBotId = chat?.primaryBot;
  const isPrimary = !primaryBotId || primaryBotId === botId;
  const isGroupLink = linkRegex.test(m.text);
  const hasAllowedLink = allowedLinks.some(link => m.text.includes(link));
  const command = (m.noPrefix?.trim().split(/\s+/)[0] || '').toLowerCase();
  if (hasAllowedLink || !isGroupLink || !chat?.antilinks || isAdmin || !isBotAdmin || !isPrimary) return;
  await client.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant }});
  if (!(command === 'invite')) {
    const isChannelLink = /whatsapp\.com\/channel\//i.test(m.text);
    const userName = global.db.data.users[m.sender]?.name || 'Usuario';
    await client.reply(m.chat, `✨ ¡Eeeeh!? *${userName}* mandó un link de *${isChannelLink ? 'un canal' : 'otro grupo'}* y tuve que sacarlo del grupo~ 💔 ¡Las reglas son las reglas, no importa cuánto me duela! Si quieres volver, ¡la próxima vez respeta las normas, ne~! 🎀`, null);
    await client.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
  }
}


const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75;

function xpRange(level, multiplier = global.multiplier || 2) {
  if (level < 0) throw new TypeError('level cannot be negative value');
  level = Math.floor(level);
  const min = level === 0 ? 0 : Math.round(Math.pow(level, growth) * multiplier) + 1;
  const max = Math.round(Math.pow(level + 1, growth) * multiplier);
  return { min, max, xp: max - min };
}

function findLevel(xp, multiplier = global.multiplier || 2) {
  if (xp === Infinity) return Infinity;
  if (isNaN(xp)) return NaN;
  if (xp <= 0) return -1;
  let level = 0;
  do { level++; } while (xpRange(level, multiplier).min <= xp);
  return --level;
}

function canLevelUp(level, xp, multiplier = global.multiplier || 2) {
  if (level < 0) return false;
  if (xp === Infinity) return true;
  if (isNaN(xp)) return false;
  if (xp <= 0) return false;
  return level < findLevel(xp, multiplier);
}

async function level(m) {
  const user = global.db.data.users[m.sender];
  const users = global.db.data.chats[m.chat].users[m.sender];
  let before = user.level;
  while (canLevelUp(user.level, user.exp, global.multiplier)) {
    user.level++;
  }
  if (before !== user.level) {
    const coinBonus = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;
    const expBonus = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
    if (user.level % 5 === 0) {
      users.coins = (users.coins || 0) + coinBonus;
      user.exp = (user.exp || 0) + expBonus;
    }
    const { min, max } = xpRange(user.level, global.multiplier);
    user.minxp = min;
    user.maxxp = max;
  }
}


async function showEnableList(client, m) {
  const availableFunctions = [
    { name: 'antilink', description: 'Elimina automáticamente enlaces de otros grupos y canales', status: '🟢 Activo' },
    { name: 'level', description: 'Sistema de niveles y experiencia para usuarios', status: '🟢 Activo' },
    { name: 'initdb', description: 'Inicialización de base de datos', status: '🟢 Activo' },
    { name: 'events', description: 'Detección de eventos grupales (promociones, degradaciones)', status: '🟢 Activo' },
    { name: 'detect', description: 'Detección de mensajes y acciones', status: '🔵 Configurable' },
    { name: 'antilink2', description: 'Protección avanzada contra enlaces', status: '🔵 Configurable' },
    { name: 'audios', description: 'Responde automáticamente con audios por palabras clave (configurable por grupo o global)', status: '🔵 Configurable' }
  ];

  let message = `🏵️ *Funciones Disponibles para Activar*\n\n`;
  message += `┌─⚡ *Funciones Principales Activas*\n`;
  
  availableFunctions.forEach((func, index) => {
    const number = (index + 1).toString().padStart(2, '0');
    message += `│ ${number}. ${func.name}\n`;
    message += `│    ${func.description}\n`;
    message += `│    Estado: ${func.status}\n`;
    if (index < availableFunctions.length - 1) message += `│\n`;
  });
  
  message += `└─⚡\n\n`;
    message += `🪷 *Uso:* \`.enable <función>\` para activar/desactivar\n`;
    message += `💫 *Ejemplo:* \`.enable antilink on\` | \`.enable welcome off\` | \`.enable audios global\``;

  await client.reply(m.chat, message, m, global.miku);
}

export default async function enableFeatures(client, m) {
  
  initDB(m, client);
  
  
  antilink(client, m);
}


export function initializeWelcome(client) {
  if (!client || !client.ev) {
    console.log('Error: cliente no válido para welcome');
    return;
  }
  try {
    welcomeHandler(client);
  } catch (err) {
    console.log('Error en welcomeHandler:', err.message);
  }
}


export { antilink, level, showEnableList };
