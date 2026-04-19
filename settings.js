import fs from 'fs';
import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath } from 'url'

global.owner = ['51939508653']
global.botNumber = ''

global.sessionName = 'Sessions/Owner'
global.version = '^2.0 - Latest'
global.dev = "© 🄿🄾🅆🄴🅁🄴🄳 CHASKI"
global.links = {
api: 'https://rest.alyabotpe.xyz',
channel: "https://whatsapp.com/channel/0029VbC04aQ6mYPDkbiMte0u",
github: "https://github.com/pukarumi23/kitagawa",
gmail: "glitchgarden449@gmail.com"
}

global.miku = { 
  contextInfo: { 
    isForwarded: true, 
    forwardedNewsletterMessageInfo: { 
      newsletterJid: "120363425300401364@newsletter", 
      serverMessageId: 100, 
      newsletterName: "🧡KITAGAWA🧡"
    },
    externalAdReply: {
      mediaUrl: null,
      description: '🌱Lo mejor🌿',
      previewType: "PHOTO",
      thumbnailUrl: global.banner || 'https://i.pinimg.com/736x/72/57/af/7257af51d06b3d917d89ff0a40f880dc.jpg',
      sourceUrl: global.channel || 'https://whatsapp.com/channel/0029VbC04aQ6mYPDkbiMte0u',
      mediaType: 1,
      renderLargerThumbnail: false
    }
  }
}

global.mess = {
socket: '🏵️ Este comando solo puede ser ejecutado por un Socket.',
admin: '🏵️ Este comando solo puede ser ejecutado por los Administradores del Grupo.',
botAdmin: '🏵️ Este comando solo puede ser ejecutado si el Socket es Administrador del Grupo.'
}

global.APIs = {
adonix: { url: "https://api-adonix.ultraplus.click", key: "Yuki-WaBot" },
vreden: { url: "https://api.vreden.web.id", key: null },
nekolabs: { url: "https://api.nekolabs.web.id", key: null },
siputzx: { url: "https://api.siputzx.my.id", key: null },
delirius: { url: "https://api.delirius.store", key: null },
ootaizumi: { url: "https://api.ootaizumi.web.id", key: null },
stellar: { url: "https://api.stellarwa.xyz", key: "YukiWaBot" },
apifaa: { url: "https://api-faa.my.id", key: null },
xyro: { url: "https://api.xyro.site", key: null },
yupra: { url: "https://api.yupra.my.id", key: null }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  import(`${file}?update=${Date.now()}`)
})
