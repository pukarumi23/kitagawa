import "./settings.js"
import main from './main.js'
import events from './interruptores/events.js'
import { initializeWelcome } from './interruptores/enable.js'
import { Browsers, makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState, fetchLatestBaileysVersion, jidDecode, DisconnectReason, jidNormalizedUser, } from "@whiskeysockets/baileys";
import cfonts from 'cfonts';
import pino from "pino";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";
import readline from "readline";
import os from "os";
import { smsg } from "./lib/message.js";
import db from "./lib/system/database.js";
import { startSubBot } from './lib/subs.js';
import { applyTmpEnvIfConfigured, ensureBotTmpDir, resolveBotTmpDir, startTmpAutoCleanup } from './lib/system/tmp.js'

const botTmpDir = resolveBotTmpDir()
applyTmpEnvIfConfigured(botTmpDir)
ensureBotTmpDir(botTmpDir).catch(() => {})
startTmpAutoCleanup(botTmpDir)

process.on('unhandledRejection', (reason, promise) => {
  const msg = String(reason?.message || reason || '');
  if (
    msg.includes('Connection Closed') ||
    msg.includes('428') ||
    msg.includes('Bad MAC') ||
    msg.includes('Session error') ||
    /Unsupported state|unable to authenticate data/i.test(msg) ||
    msg.toLowerCase().includes('forbidden') ||
    reason?.data === 403
  ) {
    return;
  }
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  const msg = String(error?.message || error || '');
  if (msg.includes('Connection Closed') || msg.includes('428') || msg.includes('Bad MAC') || msg.includes('Session error')) {
    return;
  }
  console.error('Uncaught Exception:', error);
});

const originalConsoleError = console.error;
const errorThrottle = new Map();
const THROTTLE_TIME = 5000;

console.error = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('Bad MAC') || msg.includes('Session error') || msg.includes('Connection Closed') || msg.includes('428')) return;
  
  const errorKey = msg.substring(0, 50);
  const now = Date.now();
  const lastLog = errorThrottle.get(errorKey);
  
  if (!lastLog || now - lastLog > THROTTLE_TIME) {
    errorThrottle.set(errorKey, now);
    originalConsoleError.apply(console, args);
  }
};

const log = {
  info: (msg) => console.log(chalk.bgBlue.white.bold(`INFO`), chalk.white(msg)),
  success: (msg) => console.log(chalk.bgGreen.white.bold(`SUCCESS`), chalk.greenBright(msg)),
  warn: (msg) => console.log(chalk.bgYellowBright.blueBright.bold(`WARNING`), chalk.yellow(msg)),
  warning: (msg) => console.log(chalk.bgYellowBright.red.bold(`WARNING`), chalk.yellow(msg)),
  error: (msg) => {
    if (msg.includes('Bad MAC') || msg.includes('Session error')) return;
    console.log(chalk.bgRed.white.bold(`ERROR`), chalk.redBright(msg));
  },
};

let _autoSessionCleanupInFlight = false
const SAFE_CLEANUP_PREFIXES = ['app-state-sync-', 'app-state-sync-key-']

async function cleanSessionFiles(dir) {
  let removed = 0
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const ent of entries) {
      if (!ent.isFile()) continue
      const name = ent.name
      if (!SAFE_CLEANUP_PREFIXES.some((p) => name.startsWith(p))) continue
      if (/\\.json$/i.test(name)) {
        try {
          await fs.promises.unlink(path.join(dir, name))
          removed++
        } catch {}
      }
    }
  } catch {}
  return removed
}

async function runAutoSessionCleanup() {
  if (_autoSessionCleanupInFlight) return
  _autoSessionCleanupInFlight = true
  try {
    const ownerDir = path.resolve(`./${global.sessionName || 'Sessions/Owner'}`)
    const subsBase = path.resolve('./Sessions/Subs')

    let removedMain = 0
    let removedSubs = 0

    removedMain += await cleanSessionFiles(ownerDir)

    if (fs.existsSync(subsBase)) {
      const subs = await fs.promises.readdir(subsBase, { withFileTypes: true })
      for (const dir of subs) {
        if (!dir.isDirectory()) continue
        removedSubs += await cleanSessionFiles(path.join(subsBase, dir.name))
      }
    }

    if (removedMain + removedSubs > 0) {
      log.info(`Auto-clean: eliminados ${removedMain} session files (Owner) y ${removedSubs} (Subs).`)
    }
  } finally {
    _autoSessionCleanupInFlight = false
  }
}

function startAutoSessionCleanup() {
  const cfg = global.autoSessionCleanup || {}
  if (cfg.enabled !== true) return
  const intervalMs = Number(cfg.intervalMs) > 0 ? Number(cfg.intervalMs) : 30 * 60 * 1000

  // One-shot at boot, then periodic.
  runAutoSessionCleanup().catch(() => {})
  const t = setInterval(() => runAutoSessionCleanup().catch(() => {}), intervalMs)
  if (typeof t.unref === 'function') t.unref()
}

startAutoSessionCleanup()

  let phoneNumber = global.botNumber || ""
  let phoneInput = ""
  const methodCodeQR = process.argv.includes("--qr")
  const methodCode = process.argv.includes("--code")
  const DIGITS = (s = "") => String(s).replace(/\D/g, "");

  function normalizePhoneForPairing(input) {
    let s = DIGITS(input);
    if (!s) return "";
    if (s.startsWith("0")) s = s.replace(/^0+/, "");
    if (s.length === 10 && s.startsWith("3")) {
      s = "57" + s;
    }
    if (s.startsWith("52") && !s.startsWith("521") && s.length >= 12) {
      s = "521" + s.slice(2);
    }
    if (s.startsWith("54") && !s.startsWith("549") && s.length >= 11) {
      s = "549" + s.slice(2);
    }
    return s;
  }
  
const { say } = cfonts
console.log(chalk.magentaBright('\n💙 Iniciando 01'))
  say('Hatsune\nMiku', {
  align: 'center',           
  gradient: ['red', 'blue'] 
})
  say('Made by (ㅎㅊDEPOOLㅊㅎ)', {
  font: 'console',
  align: 'center',
  gradient: ['blue', 'magenta']
})

const BOT_TYPES = [
  { name: 'SubBot', folder: './Sessions/Subs', starter: startSubBot }
]

global.conns = global.conns || []
const reconnecting = new Set()

async function loadBots() {
  for (const { name, folder, starter } of BOT_TYPES) {
    if (!fs.existsSync(folder)) continue
    const botIds = fs.readdirSync(folder)
    for (const userId of botIds) {
      const sessionPath = path.join(folder, userId)
      const credsPath = path.join(sessionPath, 'creds.json')
      if (!fs.existsSync(credsPath)) continue
      if (global.conns.some((conn) => conn.userId === userId)) continue
      if (reconnecting.has(userId)) continue
      try {
        reconnecting.add(userId)
        await starter(null, null, 'Auto reconexión', false, userId, sessionPath)
      } catch (e) {
      } finally {
        reconnecting.delete(userId)
      }
      await new Promise((res) => setTimeout(res, 1500))
    }
  }
  setTimeout(loadBots, 120 * 1000)
}

function clearOwnerSession(prefixes = []) {
  try {
    const ownerDir = path.resolve('./Sessions/Owner')
    if (!fs.existsSync(ownerDir)) return
    for (const file of fs.readdirSync(ownerDir)) {
      if (prefixes.length && !prefixes.some((p) => file.startsWith(p))) continue
      fs.rmSync(path.join(ownerDir, file), { recursive: true, force: true })
    }
  } catch {}
}

(async () => {
  await loadBots()
})()

let opcion;
if (methodCodeQR) {
  opcion = "1";
} else if (methodCode) {
  opcion = "2";
} else if (!fs.existsSync("./Sessions/Owner/creds.json")) {
  opcion = readlineSync.question(chalk.bold.white("\nSeleccione una opción:\n") + chalk.blueBright("1. Con código QR\n") + chalk.cyan("2. Con código de texto de 8 dígitos\n╌╌➢ "));
  while (!/^[1-2]$/.test(opcion)) {
    console.log(chalk.bold.redBright(`No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales.`));
    opcion = readlineSync.question("╌╌➢ ");
  }
  if (opcion === "2") {
    console.log(chalk.bold.redBright(`\nPor favor, Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright("Ejemplo: +51953******")}\n${chalk.bold.magentaBright('╌╌➢ ')} `));
    phoneInput = readlineSync.question("");
    phoneNumber = normalizePhoneForPairing(phoneInput);
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName)
  const { version, isLatest } = await fetchLatestBaileysVersion()
  const logger = pino({ level: "silent" })

  console.info = () => {}
  console.debug = () => {}

  const browserDesc =
    typeof Browsers?.macOS === 'function'
      ? Browsers.macOS('Chrome')
      : (Browsers?.macOS ?? ['macOS', 'Chrome', '10.15.7'])

  const client = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: browserDesc,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    getMessage: async () => "",
    keepAliveIntervalMs: 45000,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    retryRequestDelayMs: 750,
    emitOwnEvents: true,
    fireInitQueries: true,
  })
  
  global.client = client;

  
  {
    const concurrency = 2
    let active = 0
    const queue = []
    const runNext = () => {
      if (active >= concurrency) return
      const next = queue.shift()
      if (!next) return
      active++
      Promise.resolve()
        .then(next.fn)
        .then(next.resolve, next.reject)
        .finally(() => {
          active--
          runNext()
        })
    }
    const limit = (fn) =>
      new Promise((resolve, reject) => {
        queue.push({ fn, resolve, reject })
        runNext()
      })

    const rawUpload = client.waUploadToServer?.bind(client)
    if (typeof rawUpload === 'function') {
      client.waUploadToServer = async (...args) =>
        limit(async () => {
          try {
            return await rawUpload(...args)
          } catch (err) {
            const msg = String(err?.message || err || '')
            const isTimeout = msg.includes('Timed Out') || msg.includes('Request Time-out') || err?.output?.statusCode === 408
            if (!isTimeout) throw err
            await new Promise((r) => setTimeout(r, 1200))
            return await rawUpload(...args)
          }
        })
    }
  }

  const rawSendMessage = client.sendMessage.bind(client)
  client.sendMessage = async (...args) => {
    try {
      const content = args?.[1]
      if (content && typeof content === 'object') {
        const fix = (s) => {
          if (typeof s !== 'string' || s.length === 0) return s
          if (!/Ã.|Â.|ðŸ.|â[\u0080-\u00FF]/.test(s)) return s
          try {
            const fixed = Buffer.from(s, 'latin1').toString('utf8')
            const bad = (x) => (String(x).match(/�/g) || []).length
            if (fixed && fixed !== s && bad(fixed) <= bad(s)) return fixed
          } catch {}
          return s
        }
        for (const k of ['text', 'caption', 'footer', 'title']) {
          if (typeof content[k] === 'string') content[k] = fix(content[k])
        }
      }
    } catch {}
    try {
      return await rawSendMessage(...args)
    } catch (err) {
      const msg = String(err?.message || err || '')
      if (msg.toLowerCase().includes('forbidden') || err?.data === 403) {
        const jid = args?.[0]
        const content = args?.[1]
        const kind = content ? Object.keys(content).filter((k) => k !== 'quoted')[0] : 'unknown'
        // limpiar primaryBot si el grupo ya no es accesible
        if (jid && String(jid).endsWith('@g.us')) {
          try {
            const chatData = global.db?.data?.chats?.[jid]
            if (chatData?.primaryBot) chatData.primaryBot = null
          } catch {}
        }
        return null
      }
      throw err
    }
  }
  client.public = true
  client.isInit = false
  client.ev.on("creds.update", saveCreds)
  if (opcion === "2" && !fs.existsSync("./Sessions/Owner/creds.json")) {
  setTimeout(async () => {
    try {
       if (!state.creds.registered) {
        const pairing = await global.client.requestPairingCode(phoneNumber)
        const codeBot = pairing?.match(/.{1,4}/g)?.join("-") || pairing
        console.log(chalk.bold.white(chalk.bgMagenta(`Código de emparejamiento:`)), chalk.bold.white(chalk.white(codeBot)))
      }
    } catch (err) {
      console.log(chalk.red("Error al generar código:"), err)
    }
  }, 3000)
}

  client.sendText = (jid, text, quoted = "", options) =>
  client.sendMessage(jid, { text: text, ...options }, { quoted })
  let reconnectAttempts = 0
  const maxReconnectAttempts = 3
  let lastError428 = 0
  const ERROR_428_COOLDOWN = 3000
  
  client.ev.on("connection.update", async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications, } = update
    
    if (qr != 0 && qr != undefined || methodCodeQR) {
    if (opcion == '1' || methodCodeQR) {
      console.log(chalk.green.bold("💙 Escanea este código QR"));
      qrcode.generate(qr, { small: true });
    }}

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode || 0;
      const errorMsg = lastDisconnect?.error?.message || '';
      
      if (reason === 428 || errorMsg.includes('Connection Closed')) {
        const now = Date.now()
        if (now - lastError428 < ERROR_428_COOLDOWN) return
        lastError428 = now
        
        reconnectAttempts++
        if (reconnectAttempts > maxReconnectAttempts) {
          reconnectAttempts = 0
          setTimeout(() => startBot(), 3000)
        } else {
          setTimeout(() => startBot(), 1500)
        }
        return
      }
      
      reconnectAttempts = 0
      
      if (errorMsg.includes('Bad MAC')) {
        clearOwnerSession(["app-state-sync-", "session-"])
        setTimeout(() => startBot(), 1500)
        return
      }
      
      if (reason === DisconnectReason.connectionLost) {
        log.warning("Se perdió la conexión al servidor, intento reconectarme..")
        setTimeout(() => startBot(), 1500)
      } else if (reason === DisconnectReason.connectionClosed) {
        log.warning("Conexión cerrada, intentando reconectarse...")
        setTimeout(() => startBot(), 1500)
      } else if (reason === DisconnectReason.restartRequired) {
        log.warning("Es necesario reiniciar..")
        setTimeout(() => startBot(), 2000)
      } else if (reason === DisconnectReason.timedOut) {
        log.warning("Tiempo de conexión agotado, intentando reconectarse...")
        setTimeout(() => startBot(), 2000)
      } else if (reason === DisconnectReason.badSession) {
        clearOwnerSession(["app-state-sync-", "session-"])
        setTimeout(() => startBot(), 1500)
      } else if (reason === DisconnectReason.connectionReplaced) {
        log.warning("Primero cierre la sesión actual...")
        setTimeout(() => startBot(), 2000)
      } else if (reason === DisconnectReason.loggedOut) {
        log.warning("Escanee nuevamente y ejecute...")
        clearOwnerSession()
        process.exit(1)
      } else if (reason === DisconnectReason.forbidden) {
        log.error("Error de conexión, escanee nuevamente y ejecute...")
        clearOwnerSession()
        process.exit(1);
      } else if (reason === DisconnectReason.multideviceMismatch) {
        log.warning("Inicia nuevamente")
        clearOwnerSession()
        process.exit(0)
      } else {
        log.warning(`Reconectando por error desconocido (${reason})...`)
        setTimeout(() => startBot(), 2500)
      }
    }
    if (connection == "open") {
         const userJid = jidNormalizedUser(client.user.id)
         const userName = client.user.name || "Desconocido"
         console.log(chalk.green.bold(`💙 Conectado a: ${userName}`))
         try {
           initializeWelcome(client);
           console.log(chalk.blue('💙 Welcome handler inicializado'));
         } catch (err) {
           console.log(chalk.red('Error inicializando Welcome:'), err.message);
         }
    }
    if (isNewLogin) {
      log.info("Nuevo dispositivo detectado")
    }
    if (receivedPendingNotifications == "true") {
      log.warn("Por favor espere aproximadamente 1 minuto...")
      client.ev.flush()
    }
  });

  let m
  client.ev.on("messages.upsert", async ({ messages, type }) => {
    try {
      m = messages[0]
      if (!m.message) return
      m.message = Object.keys(m.message)[0] === "ephemeralMessage" ? m.message.ephemeralMessage.message : m.message
      if (m.key && m.key.remoteJid === "status@broadcast") return
      if (!client.public && !m.key.fromMe && type === "notify") return
      if (m.key.id.startsWith("BAE5") && m.key.id.length === 16) return
      m = await smsg(client, m)
      main(client, m, messages).catch(err => {
        if (!err.message?.includes('Bad MAC') && !err.message?.includes('Session error') && !err.message?.includes('Connection Closed')) {
          console.log(err)
        }
      })
    } catch (err) {
      if (!err.message?.includes('Bad MAC') && !err.message?.includes('Session error') && !err.message?.includes('Connection Closed')) {
        console.log(err)
      }
    }
  })
  try {
  await events(client, m)
  } catch (err) {
   console.log(chalk.gray(`[ BOT  ]  → ${err}`))
  }
  client.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {}
      return ((decode.user && decode.server && decode.user + "@" + decode.server) || jid)
    } else return jid
  }
}

(async () => {
    global.loadDatabase()
    console.log(chalk.gray('💙 Base de datos cargada correctamente.'))
  await startBot()
})()
