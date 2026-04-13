import ws from 'ws';
import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import gradient from 'gradient-string';
import seeCommands from './lib/system/commandLoader.js';
import initDB from './lib/system/initDB.js';
import enableFeatures, { level } from './interruptores/enable.js';
import { getGroupAdmins } from './lib/message.js';
import { processYouTubeButton } from './interruptores/downloads/play.js';
import { peekGroupMetadata, safeGetGroupMetadata } from './lib/utils.js';

seeCommands()

let sessionBotsCache = { value: [], expires: 0 }
const allowWhenNotPrimary = new Set([
  'setbanner',
  'setbotbanner',
  'seticon',
  'setboticon',
  'setbotname',
  'setname',
  'setimage',
  'setpfp',
])

const normDigits = (jid = '') => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '')
const LOG_MESSAGES = String(process.env.LOG_MESSAGES || '').toLowerCase() !== 'false'
const LOG_BODY_MAX_LEN = Number(process.env.LOG_BODY_MAX_LEN || 500)
const HOOK_TIMEOUT_ALL_MS = Number(process.env.HOOK_TIMEOUT_ALL_MS || 1500)
const HOOK_TIMEOUT_BEFORE_MS = Number(process.env.HOOK_TIMEOUT_BEFORE_MS || 2000)
const HOOK_CONCURRENCY = Number(process.env.HOOK_CONCURRENCY || 8)
const SESSION_BOTS_CACHE_TTL_MS = Number(process.env.SESSION_BOTS_CACHE_TTL_MS || 8000)
const BEFORE_HOOK_AWAIT_FOR_NON_COMMAND = String(process.env.BEFORE_HOOK_AWAIT_FOR_NON_COMMAND || '').toLowerCase() === 'true'

function withTimeout(promise, ms) {
  if (!ms || ms <= 0) return promise
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(Symbol.for('timeout')), ms)),
  ])
}

async function runHooksConcurrently(hooks, worker, concurrency) {
  const list = Array.isArray(hooks) ? hooks : []
  if (list.length === 0) return

  const limit = Math.max(1, Math.min(32, Number(concurrency) || 1))
  let index = 0

  const runners = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (index < list.length) {
      const current = list[index++]
      await worker(current)
    }
  })

  await Promise.all(runners)
}

function collectPluginHooks(hookName) {
  const hooks = []
  for (const name in global.plugins) {
    const plugin = global.plugins[name]
    const fn = plugin?.[hookName]
    if (typeof fn === 'function') hooks.push({ name, fn })
  }
  return hooks
}

function getAllSessionBots(client) {
  const now = Date.now()
  if (sessionBotsCache.expires > now) return sessionBotsCache.value

 
  const activeBots = (global.conns || []).map((c) => {
    const id = c?.user?.id?.split(':')[0] || c?.user?.lid
    return id ? id + '@s.whatsapp.net' : null
  }).filter(Boolean)

 
  try {
    const ownerId = (global.client?.user?.id?.split(':')[0] || global.client?.user?.lid || client?.user?.id?.split(':')[0] || client?.user?.lid) + '@s.whatsapp.net'
    if (ownerId && !activeBots.includes(ownerId)) activeBots.push(ownerId)
  } catch {}

  sessionBotsCache = { value: activeBots, expires: now + SESSION_BOTS_CACHE_TTL_MS }
  return activeBots
}

export default async (client, m) => {
if (!m.message) return
const sender = m.sender 

let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.message.templateButtonReplyMessage?.selectedId || m.msg?.selectedButtonId || m.msg?.buttonResponseMessage?.selectedButtonId || m.msg?.templateButtonReplyMessage?.selectedId || m.msg?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || m.text || m.body || ''

const extractButtonId = (msg) => {
  if (!msg?.message) return ''
  if (msg.message?.buttonsResponseMessage?.selectedButtonId) return msg.message.buttonsResponseMessage.selectedButtonId
  if (msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId) return msg.message.listResponseMessage.singleSelectReply.selectedRowId
  if (msg.message?.templateButtonReplyMessage?.selectedId) return msg.message.templateButtonReplyMessage.selectedId
  const paramsJson = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
  if (paramsJson) {
    try {
      const params = JSON.parse(paramsJson)
      if (params?.id) return params.id
    } catch {}
  }
  return ''
}

const from = m.key.remoteJid
const botJid = (client.user?.id?.split(':')[0] || client.user?.lid) + '@s.whatsapp.net'
const chat = global.db.data.chats[m.chat] || {}
if (!chat.users) chat.users = {}
const settings = global.db.data.settings[botJid] || {}  
const senderBase = String(sender || '').split('@')[0].replace(/\D/g, '')
const ownerBases = new Set([
...global.owner.map((num) => String(num).replace(/\D/g, '')),
String(settings.owner || '').replace(/\D/g, ''),
].filter(Boolean))
const isOwners =
  sender === botJid ||
  ownerBases.has(senderBase) ||
  [...(settings.owner ? [settings.owner] : []), ...global.owner.map(num => num + '@s.whatsapp.net')].includes(sender)
const user = global.db.data.users[sender] ||= {}
const users = chat.users[sender] || {}
if (!chat.users[sender]) chat.users[sender] = users
users.stats ||= {}


try {
  const allHooks = collectPluginHooks('all')
  void runHooksConcurrently(
    allHooks,
    async ({ name, fn }) => {
      try {
        const out = await withTimeout(Promise.resolve(fn.call(client, m, { client })), HOOK_TIMEOUT_ALL_MS)
        if (out === Symbol.for('timeout') && String(process.env.HOOK_DEBUG || '').toLowerCase() === 'true') {
          console.log(`[hook:all] timeout -> ${name}`)
        }
      } catch (err) {
        console.error(`Error en plugin.all -> ${name}`, err)
      }
    },
    HOOK_CONCURRENCY,
  )
} catch {}

enableFeatures(client, m)
const buttonIdForCmd = extractButtonId(m)
const textForCmd = String(buttonIdForCmd || m.text || m.body || '').trim()
const rawBotname = settings.namebot || 'Miku'
const tipo = settings.type || 'Sub'
const isValidBotname = /^[\w\s]+$/.test(rawBotname)
const namebot = isValidBotname ? rawBotname : 'Miku'
const shortForms = [namebot.charAt(0), namebot.split(" ")[0], tipo.split(" ")[0]]
const prefixes = [namebot, ...shortForms]
let prefix
if (Array.isArray(settings.prefix) || typeof settings.prefix === 'string') {
const prefixArray = Array.isArray(settings.prefix) ? settings.prefix : [settings.prefix]
prefix = new RegExp('^(' + prefixes.join('|') + ')?(' + prefixArray.map(p => p.replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&')).join('|') + ')', 'i')
} else if (settings.prefix === true) {
prefix = new RegExp('^', 'i')
} else {
prefix = new RegExp('^(' + prefixes.join('|') + ')?', 'i')
}
const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
let pluginPrefix = client.prefix ? client.prefix : prefix
let matchs = pluginPrefix instanceof RegExp ? [[pluginPrefix.exec(textForCmd), pluginPrefix]] : Array.isArray(pluginPrefix) ? pluginPrefix.map(p => {
let regex = p instanceof RegExp ? p : new RegExp(strRegex(p))
return [regex.exec(textForCmd), regex]}) : typeof pluginPrefix === 'string' ? [[new RegExp(strRegex(pluginPrefix)).exec(textForCmd), new RegExp(strRegex(pluginPrefix))]] : [[null, null]]
let match = matchs.find(p => p[0])


try {
  const beforeHooks = collectPluginHooks('before').filter(({ name }) => !global.plugins?.[name]?.disabled)
  const beforeHooksTask = runHooksConcurrently(
    beforeHooks,
    async ({ name, fn }) => {
      try {
        const out = await withTimeout(Promise.resolve(fn.call(client, m, { client })), HOOK_TIMEOUT_BEFORE_MS)
        if (out === Symbol.for('timeout') && String(process.env.HOOK_DEBUG || '').toLowerCase() === 'true') {
          console.log(`[hook:before] timeout -> ${name}`)
        }
      } catch (err) {
        console.error(`Error en plugin.before -> ${name}`, err)
      }
    },
    HOOK_CONCURRENCY,
  )

  if (match || BEFORE_HOOK_AWAIT_FOR_NON_COMMAND) {
    await beforeHooksTask
  } else {
    void beforeHooksTask
  }
} catch {}

if (!match) {
  const buttonId = m.body || m.text;
  if (buttonId && (
    buttonId.includes('youtube_audio_') || 
    buttonId.includes('youtube_video_360_') || 
    buttonId.includes('youtube_video_doc_') || 
    buttonId.includes('youtube_audio_doc_')
  )) {
    const botprimaryId = chat?.primaryBot
    const isPrimary = !botprimaryId || normDigits(botprimaryId) === normDigits(botJid)
    if (isPrimary) {
      processYouTubeButton(client, m).catch(err => console.error('Error YouTube button:', err));
    }
  }
  return;
}
let usedPrefix = (match[0] || [])[0] || ''
let args = textForCmd.slice(usedPrefix.length).trim().split(" ")
let command = (args.shift() || '').toLowerCase()
let text = args.join(' ')

if (!command) return
const cmdData = global.comandos.get(command)
if (!cmdData) {
if (settings.prefix === true) return
return
}

const botprimaryId = chat?.primaryBot
const primaryDigits = normDigits(botprimaryId || '')
const botDigits = normDigits(botJid || '')
if (botprimaryId && primaryDigits && primaryDigits !== botDigits && !allowWhenNotPrimary.has(command)) {
  const sessionBots = getAllSessionBots(client)
  const primaryInSessions = sessionBots.some((jid) => normDigits(jid) === primaryDigits)
  if (primaryInSessions && m.isGroup) {
    const metadata = peekGroupMetadata(m.chat) || (await safeGetGroupMetadata(m.chat, client, 1, 1500))
    const participants = metadata?.participants || []
    
    if (participants.length > 0) {
      const primaryInGroup = participants.some((p) => normDigits(p?.phoneNumber || p?.jid || p?.id || p?.lid) === primaryDigits)
      if (primaryInGroup) return
    }
    
  }
}

const pushname = m.pushName || 'Sin nombre'
let groupMetadata = m.isGroup ? peekGroupMetadata(m.chat) : null
let groupAdmins = groupMetadata?.participants?.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || []
let groupName = groupMetadata?.subject || ''
let isBotAdmins = groupAdmins.some(p => p.phoneNumber === botJid || p.jid === botJid || p.id === botJid || p.lid === botJid )
let isAdmins = groupAdmins.some(p => p.phoneNumber === sender || p.jid === sender || p.id === sender || p.lid === sender )
let groupCtxLoaded = !!groupMetadata
const ensureGroupContext = async () => {
if (!m.isGroup || groupCtxLoaded) return
groupCtxLoaded = true
groupMetadata = await safeGetGroupMetadata(m.chat, client, 2, 2500)
groupName = groupMetadata?.subject || ''
groupAdmins = groupMetadata?.participants?.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || []
isBotAdmins = groupAdmins.some(p => p.phoneNumber === botJid || p.jid === botJid || p.id === botJid || p.lid === botJid )
isAdmins = groupAdmins.some(p => p.phoneNumber === sender || p.jid === sender || p.id === sender || p.lid === sender )
}

const chatData = global.db.data.chats[from]
if (!chatData.users) chatData.users = {}
const consolePrimary = chatData.primaryBot
const isMainBot = !consolePrimary || consolePrimary === (client.user?.id?.split(':')[0] || client.user?.lid) + '@s.whatsapp.net'

if (isMainBot && LOG_MESSAGES) {
const bodyPreview = typeof body === 'string' && body.length > LOG_BODY_MAX_LEN
  ? `${body.slice(0, LOG_BODY_MAX_LEN)}…`
  : body

const h = chalk.bold.blue('╔⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍···')
const t = chalk.bold.blue('╚⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍⚍···')
const v = chalk.bold.blue('┇')
console.log(`\n${h}\n${chalk.bold.yellow(`${v} Fecha: ${chalk.whiteBright(moment().format('DD/MM/YY HH:mm:ss'))} p. m.`)}\n${chalk.bold.blueBright(`${v} Usuario: ${chalk.whiteBright(`(${pushname})`)}`)}\n${chalk.bold.magentaBright(`${v} Remitente: ${gradient('deepskyblue', 'darkorchid')(sender)}`)}\n${m.isGroup ? chalk.bold.cyanBright(`${v} Grupo: ${chalk.greenBright(groupName)}\n${v} Mensaje: ${bodyPreview}`) : chalk.bold.greenBright(`${v} Mensaje: ${bodyPreview}`)}\n${t}`)
}

if ((m.id.startsWith("3EB0") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20))) return  
if (!isOwners && settings.self) return
if (m.chat && !m.chat.endsWith('g.us')) {
const allowedInPrivateForUsers = new Set(['code', 'bots', 'menu', 'ping', 'infobot', 'status'])
const privateCmd = String(command || '').toLowerCase().replace(/^[./!#]+/, '')
if (!isOwners && !allowedInPrivateForUsers.has(privateCmd)) return
}
if (chat?.isBanned && !(command === 'bot' && text === 'on') && !global.owner.map(num => num + '@s.whatsapp.net').includes(sender)) {
await m.reply(`💙 El bot *${settings.botname}* está desactivado en este grupo.\n\n> 🌱 Un *administrador* puede activarlo con el comando:\n> » *${usedPrefix}bot on*`)
return
}

const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
if (!chatData.users[sender]) chatData.users[sender] = {}
const userrs = chatData.users[sender]
if (!userrs.stats) userrs.stats = {}
if (!userrs.stats[today]) userrs.stats[today] = { msgs: 0, cmds: 0 }
userrs.stats[today].msgs++

if (chat.adminonly && m.isGroup) {
await ensureGroupContext()
if (!isAdmins) return
}
const comando = textForCmd.slice(usedPrefix.length);
if (cmdData.isOwner && !global.owner.map(num => num + '@s.whatsapp.net').includes(sender)) {
if (settings.prefix === true) return
return
}
if ((cmdData.isAdmin || cmdData.botAdmin) && m.isGroup) {
await ensureGroupContext()
}
if (cmdData.isAdmin && !isAdmins) return client.reply(m.chat, mess.admin, m)
if (cmdData.botAdmin && !isBotAdmins) return client.reply(m.chat, mess.botAdmin, m)
try {
client.readMessages([m.key]).catch(() => {})
user.usedcommands = (user.usedcommands || 0) + 1
settings.commandsejecut = (settings.commandsejecut || 0) + 1
users.usedTime = new Date()
users.lastCmd = Date.now()
user.exp = (user.exp || 0) + Math.floor(Math.random() * 100)
user.name = m.pushName
if (!users.stats[today]) users.stats[today] = { msgs: 0, cmds: 0 }
users.stats[today].cmds++
await cmdData.run(client, m, args, usedPrefix, command, text)
level(m)
} catch (error) {
 const eMsg = String(error?.message || error || '')
 if (eMsg.toLowerCase().includes('rate') || error?.data === 429) {
   await new Promise(r => setTimeout(r, 3000))
   try {
     await cmdData.run(client, m, args, usedPrefix, command, text)
   } catch {}
   return
 }
 try {
   await client.sendMessage(m.chat, { text: `Error: ${error}` }, { quoted: m })
 } catch (e) { console.log('Error al enviar:', e.message) }
}
}

