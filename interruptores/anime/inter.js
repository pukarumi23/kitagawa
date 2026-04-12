import fetch from 'node-fetch';
import { resolveLidToRealJid } from "../../lib/utils.js"

const captions = {
  peek: (from, to, genero) => from === to ? `💕 ${global.miku || 'HATSUNE MIKU'} está espiando detrás de una puerta con complicidad...` : `💕 ${global.miku || 'HATSUNE MIKU'} está espiando a`,
  comfort: (from, to) => (from === to ? `🎀 ${global.miku || 'HATSUNE MIKU'} se consuela en sus propios pensamientos...` : `🎀 ${global.miku || 'HATSUNE MIKU'} está consolando a`),
  thinkhard: (from, to) => from === to ? `🦋 ${global.miku || 'HATSUNE MIKU'} se perdió en un profundo pensamiento...` : `🦋 ${global.miku || 'HATSUNE MIKU'} está pensando intensamente en`,
  curious: (from, to) => from === to ? `✦ ${global.miku || 'HATSUNE MIKU'} posee una curiosidad irresistible...` : `✦ ${global.miku || 'HATSUNE MIKU'} está curiosa por lo que hace`,
  sniff: (from, to) => from === to ? `💗 Se olfatea como si buscara algo exótico...` : `💗 Está olfateando a`,
  stare: (from, to) => from === to ? `⭐ Se queda mirando al vacío con una expresión misteriosa...` : `⭐ Se queda mirando fijamente a`,
  trip: (from, to) => from === to ? `💖 Se tropezó consigo mismo de forma dramática...` : `💖 Tropezó accidentalmente con`,
  blowkiss: (from, to) => (from === to ? `💓 Se manda un beso al espejo con elegancia seductora...` : `💓 Le lanzó un beso bien sensual a`),
  snuggle: (from, to) => from === to ? `🌸 Se acurruca con una almohada suave como un gatito...` : `🌸 Se acurruca dulcemente con`,
  sleep: (from, to, genero) => from === to ? `🌺 Está durmiendo plácidamente como un ángel...` : `🌺 Está durmiendo con`,
  cold: (from, to, genero) => (from === to ? `❄️ Tiene mucho frío y tiembla delicadamente...` : `❄️ Se congela por el frío de`),
  sing: (from, to, genero) => (from === to ? `🎵 Está cantando con una voz cautivadora...` : `🎵 Le está cantando apasionadamente a`),
  tickle: (from, to, genero) => from === to ? `😆 Se está haciendo cosquillas a sí misma...` : `😆 Le está haciendo cosquillas a`,
  scream: (from, to, genero) => from === to ? `📢 Está gritando dramáticamente al viento...` : `📢 Le está gritando apasionadamente a`,
  push: (from, to, genero) => from === to ? `💫 Se empujó a sí mismo bruscamente...` : `💫 Empujó a`,
  nope: (from, to, genero) => from === to ? `❌ Expresa claramente su rechazo absoluto...` : `❌ Dice "¡Ni lo pienses!" a`,
  jump: (from, to, genero) => from === to ? `🎉 ¡Salta de felicidad desbordante!` : `🎉 Salta feliz y emocionada con`,
  heat: (from, to, genero) => from === to ? `🔥 Siente un calor intenso invadiendo su cuerpo...` : `🔥 Se siente acalorada por`,
  gaming: (from, to, genero) => from === to ? `👾 Está jugando con total concentración...` : `👾 Está jugando competitivamente con`,
  draw: (from, to, genero) => from === to ? `🎨 Hace un lindo dibujo con pasión...` : `🎨 Dibuja inspirada en`,
  call: (from, to, genero) => from === to ? `📞 Marca su propio número esperando una respuesta...` : `📞 Llamó al número de`,
  seduce: (from, to, genero) => from === to ? `💋 Lanzó una mirada seductora y provocativa...` : `💋 Está intentando seducir a`,
  shy: (from, to, genero) => from === to ? `😳 Se sonrojó tímidamente y desvió la mirada...` : `😳 Se siente demasiado ${genero === 'Hombre' ? 'tímido' : genero === 'Mujer' ? 'tímida' : 'tímide'} para mirar a`,
  slap: (from, to, genero) => from === to ? `👋 Se dio una bofetada a sí ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'}... ¡Eso dolió!` : `👋 Le dio una bofetada a`,
  bath: (from, to) => (from === to ? `🛁 Se está bañando lentamente...` : `🛁 Está bañando a`),
  angry: (from, to, genero) => from === to ? `💢 Está muy ${genero === 'Hombre' ? 'enojado' : genero === 'Mujer' ? 'enojada' : 'enojadx'}... ¡Cuidado!` : `💢 Está super ${genero === 'Hombre' ? 'enojado' : genero === 'Mujer' ? 'enojada' : 'enojadx'} con`,
  bored: (from, to, genero) => from === to ? `😑 Está muy ${genero === 'Hombre' ? 'aburrido' : genero === 'Mujer' ? 'aburrida' : 'aburridx'}...` : `😑 Está ${genero === 'Hombre' ? 'aburrido' : genero === 'Mujer' ? 'aburrida' : 'aburridx'} de`,
  bite: (from, to, genero) => from === to ? `🦷 Se mordió ${genero === 'Hombre' ? 'solito' : genero === 'Mujer' ? 'solita' : 'solitx'}... ¡Auch!` : `🦷 Mordió a`,
  bleh: (from, to) => from === to ? `👅 Se sacó la lengua frente al espejo de forma burlona...` : `👅 Le está haciendo muecas con la lengua a`,
  bonk: (from, to, genero) => from === to ? `💥 Se dio un bonk a sí ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'}...` : `💥 Le dio un golpe a`,
  blush: (from, to) => (from === to ? `😊 Se sonrojó profundamente...` : `😊 Se sonrojó por`),
  impregnate: (from, to) => (from === to ? `👶 Se embarazó de forma dramática...` : `👶 Embarazó a`),
  bully: (from, to, genero) => from === to ? `😈 Se hace bullying ${genero === 'Hombre' ? 'el mismo' : genero === 'Mujer' ? 'ella misma' : 'el/ella mismx'}...` : `😈 Le está haciendo bullying a`,
  cry: (from, to) => (from === to ? `😭 Está llorando dolorosamente...` : `😭 Está llorando por`),
  happy: (from, to) => (from === to ? `😊 ¡Está feliz y radiante!` : `😊 Está feliz con`),
  coffee: (from, to) => (from === to ? `☕ Está tomando café con elegancia...` : `☕ Está tomando café con`),
  clap: (from, to) => (from === to ? `👏 Está aplaudiendo por algo extraordinario...` : `👏 Está aplaudiendo por`),
  cringe: (from, to) => (from === to ? `😬 Siente cringe intenso...` : `😬 Siente cringe por`),
  dance: (from, to) => (from === to ? `💃 ¡Está bailando con sensualidad!` : `💃 Está bailando seductoramente con`),
  cuddle: (from, to, genero) => from === to ? `🤗 Se acurrucó ${genero === 'Hombre' ? 'solo' : genero === 'Mujer' ? 'sola' : 'solx'}...` : `🤗 Se acurrucó con`,
  drunk: (from, to, genero) => from === to ? `🍷 Está demasiado ${genero === 'Hombre' ? 'borracho' : genero === 'Mujer' ? 'borracha' : 'borrachx'}...` : `🍷 Está ${genero === 'Hombre' ? 'borracho' : genero === 'Mujer' ? 'borracha' : 'borrachx'} con`,
  dramatic: (from, to) => from === to ? `🎭 ¡Está haciendo un drama exagerado!` : `🎭 Le está haciendo un drama a`,
  handhold: (from, to, genero) => from === to ? `🤝 Se dio la mano consigo ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'}...` : `🤝 Le agarró la mano a`,
  eat: (from, to) => (from === to ? `🍴 Está comiendo algo exquisito...` : `🍴 Está comiendo con`),
  highfive: (from, to) => from === to ? `✋ Se chocó los cinco frente al espejo... ¡Épico!` : `✋ Chocó los 5 con`,
  hug: (from, to, genero) => from === to ? `🤗 Se abrazó a sí ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'} con ternura...` : `🤗 Le dio un abrazo caloroso a`,
  kill: (from, to) => (from === to ? `💀 Se autoeliminó en modo dramático... RIP` : `💀 Asesinó a`),
  kiss: (from, to) => (from === to ? `💋 Se mandó un beso al aire apasionadamente...` : `💋 Le dio un beso apasionado a`),
  kisscheek: (from, to) => from === to ? `😘 Se besó en la mejilla usando un espejo...` : `😘 Le dio un beso en la mejilla a`,
  lick: (from, to) => (from === to ? `👅 Se lamió por curiosidad sensual...` : `👅 Lamió a`),
  laugh: (from, to) => (from === to ? `😂 Se está riendo de algo con ganas...` : `😂 Se está burlando de`),
  pat: (from, to) => (from === to ? `🥰 Se acarició la cabeza con ternura...` : `🥰 Le dio una caricia a`),
  love: (from, to, genero) => from === to ? `💕 Se quiere mucho a sí ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'}...` : `💕 Siente atracción profunda por`,
  pout: (from, to, genero) => from === to ? `😢 Está haciendo pucheros ${genero === 'Hombre' ? 'solo' : genero === 'Mujer' ? 'sola' : 'solx'}...` : `😢 Está haciendo pucheros con`,
  punch: (from, to) => (from === to ? `👊 Lanzó un puñetazo al aire... ¡POW!` : `👊 Le dio un puñetazo a`),
  run: (from, to) => (from === to ? `🏃 ¡Está corriendo por su vida!` : `🏃 Está corriendo con`),
  scared: (from, to, genero) => from === to ? `😨 Está ${genero === 'Hombre' ? 'asustado' : genero === 'Mujer' ? 'asustada' : 'asustxd'} por algo...` : `😨 Está ${genero === 'Hombre' ? 'asustado' : genero === 'Mujer' ? 'asustada' : 'asustxd'} por`,
  sad: (from, to) => (from === to ? `😔 Está triste y melancólica...` : `😔 Está expresando su tristeza a`),
  smoke: (from, to) => (from === to ? `🚬 Está fumando tranquilamente con elegancia...` : `🚬 Está fumando con`),
  smile: (from, to) => (from === to ? `😊 Está sonriendo radiante...` : `😊 Le sonrió apasionadamente a`),
  spit: (from, to, genero) => from === to ? `😛 Se escupió a sí ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'} por accidente...` : `😛 Le escupió a`,
  smug: (from, to) => (from === to ? `😏 Está presumiendo mucho últimamente...` : `😏 Está presumiendo a`),
  think: (from, to) => from === to ? `🤔 Está pensando profundamente...` : `🤔 No puede dejar de pensar en`,
  step: (from, to, genero) => from === to ? `🦶 Se pisó a sí ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'} por accidente...` : `🦶 Está pisando a`,
  wave: (from, to, genero) => from === to ? `👋 Se saludó a sí ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'} en el espejo...` : `👋 Está saludando a`,
  walk: (from, to) => (from === to ? `🚶 Salió a caminar en soledad melancólica...` : `🚶 Decidió dar un paseo con`),
  wink: (from, to, genero) => from === to ? `😉 Se guiñó a sí ${genero === 'Hombre' ? 'mismo' : genero === 'Mujer' ? 'misma' : 'mismx'} en el espejo...` : `😉 Le guiñó seductoramente a`,
  psycho: (from, to) => from === to ? `👹 ¡Está actuando como un psicópata desenfrenado!` : `👹 Está teniendo un ataque de locura por`,
  poke: (from, to) => from === to ? `👉 Se picó a sí mismo...` : `👉 Le da un golpecito a`,
  cook: (from, to) => from === to ? `👨‍🍳 Está concentrado en la cocina...` : `👨‍🍳 Se divierte cocinando con`,
  lewd: (from, to) => from === to ? `😈 Se comporta de forma provocativa y sensual...` : `😈 Se mueve de manera seductora por`,
  greet: (from, to) => from === to ? `👋 Extiende la mano para saludar a todos...` : `👋 Extiende la mano para saludar a`,
  facepalm: (from, to) => from === to ? `🤦 Se frustra y se da una palmada en la cara...` : `🤦 Se da una palmada en la cara por`,
}

// 💕 Bordes minimalistas - Emojis NUEVOS 💕
const topBorders = [
  '✦ ── ♡ Marin ♡ ── ✦',
  '💕 ─────────── 💕',
  '🌸 ─── 💗 ─── 🌸',
  '👑 ─────────── 👑',
  '🦋 ─── 💖 ─── 🦋',
  '⭐ ─────────── ⭐',
  '🎀 ─── 💓 ─── 🎀',
]

const bottomBorders = [
  '✦ ── ♡ ♡ ♡ ── ✦',
  '💕 ─────────── 💕',
  '🌸 ─── 💗 ─── 🌸',
  '👑 ─────────── 👑',
  '🦋 ─── 💖 ─── 🦋',
  '⭐ ─────────── ⭐',
  '🎀 ─── 💓 ─── 🎀',
]

// Tipografías especiales para Marin - MÁS SUTILES
const styleNames = [
  '𝓜𝓪𝓻𝓲𝓷',
  '𝑀𝒶𝓇𝒾𝓃',
  '𝙼𝚊𝚛𝚒𝚗',
  'Marin',
  '✧ Marin ✧',
]

// Descripciones de "modo activado" - MINIMALISTAS
const chaoskiDescriptions = [
  '「 Modo sensual activado 」',
  '「 Modo elegancia 」',
  '「 Modo romance 」',
  '「 Modo provocación 」',
  '「 Modo fashionista 」',
  '「 Modo seducción 」',
]

// Adjetivos finales - SUTILES
const chaoskiAdjectives = [
  '✧ Sin control',
  '✧ Desenfrenada',
  '✧ Provocativa',
  '✧ Seductora',
  '✧ Arrebatadora',
  '✧ Cautivadora',
]

function getRandomTopBorder() {
  return topBorders[Math.floor(Math.random() * topBorders.length)]
}

function getRandomBottomBorder() {
  return bottomBorders[Math.floor(Math.random() * bottomBorders.length)]
}

function getRandomStyleName() {
  return styleNames[Math.floor(Math.random() * styleNames.length)]
}

function getRandomChaoskiDescription() {
  return chaoskiDescriptions[Math.floor(Math.random() * chaoskiDescriptions.length)]
}

function getRandomChaoskiAdjective() {
  return chaoskiAdjectives[Math.floor(Math.random() * chaoskiAdjectives.length)]
}

const alias = {
  psycho: ['psycho', 'locura'],
  poke: ['poke', 'picar'],
  cook: ['cook', 'cocinar'],
  lewd: ['lewd', 'provocativo', 'provocativa'],
  greet: ['greet', 'saludar', 'hola', 'hi'],
  facepalm: ['facepalm', 'palmada', 'frustracion'],
  angry: ['angry','enojado','enojada'],
  bleh: ['bleh'],
  bored: ['bored','aburrido','aburrida'],
  clap: ['clap','aplaudir'],
  coffee: ['coffee','cafe'],
  dramatic: ['dramatic','drama'],
  drunk: ['drunk'],
  cold: ['cold'],
  impregnate: ['impregnate','preg','preñar','embarazar'],
  kisscheek: ['kisscheek','beso','besar'],
  laugh: ['laugh'],
  love: ['love','amor'],
  pout: ['pout','mueca'],
  punch: ['punch','golpear'],
  run: ['run','correr'],
  sad: ['sad','triste'],
  scared: ['scared','asustado'],
  seduce: ['seduce','seducir'],
  shy: ['shy','timido','timida'],
  sleep: ['sleep','dormir'],
  smoke: ['smoke','fumar'],
  spit: ['spit','escupir'],
  step: ['step','pisar'],
  think: ['think','pensar'],
  walk: ['walk','caminar'],
  hug: ['hug','abrazar'],
  kill: ['kill','matar'],
  eat: ['eat','nom','comer'],
  kiss: ['kiss','muak','besar'],
  wink: ['wink','guiñar'],
  pat: ['pat','acariciar'],
  happy: ['happy','feliz'],
  bully: ['bully','molestar'],
  bite: ['bite','morder'],
  blush: ['blush','sonrojarse'],
  wave: ['wave','saludar'],
  bath: ['bath','bañarse'],
  smug: ['smug','presumir'],
  smile: ['smile','sonreir'],
  highfive: ['highfive','choca'],
  handhold: ['handhold','tomar'],
  cringe: ['cringe','mueca'],
  bonk: ['bonk','golpe'],
  cry: ['cry','llorar'],
  lick: ['lick','lamer'],
  slap: ['slap','bofetada'],
  dance: ['dance','bailar'],
  cuddle: ['cuddle','acurrucar'],
  sing: ['sing','cantar'],
  tickle: ['tickle','cosquillas'],
  scream: ['scream','gritar'],
  push: ['push','empujar'],
  nope: ['nope','no'],
  jump: ['jump','saltar'],
  heat: ['heat','calor'],
  gaming: ['gaming','jugar'],
  draw: ['draw','dibujar'],
  call: ['call','llamar'],
  snuggle: ['snuggle','acurrucarse'],
  blowkiss: ['blowkiss','besito'],
  trip: ['trip','tropezar'],
  stare: ['stare','mirar'],
  sniff: ['sniff','oler'],
  curious: ['curious','curioso','curiosa'],
  thinkhard: ['thinkhard','pensar'],
  comfort: ['comfort','consolar'],
  peek: ['peek','mirar']
};

export default {
command: ['angry','enojado','enojada','bleh','bored','aburrido','aburrida','clap','aplaudir','coffee','cafe','dramatic','drama','drunk','cold','impregnate','preg','preñar','embarazar','kisscheek','beso','besar','laugh','love','amor','pout','mueca','punch','golpear','run','correr','sad','triste','scared','asustado','seduce','seducir','shy','timido','timida','sleep','dormir','smoke','fumar','spit','escupir','step','pisar','think','pensar','walk','caminar','hug','abrazar','kill','matar','eat','nom','comer','kiss','muak','wink','guiñar','pat','acariciar','happy','feliz','bully','molestar','bite','morder','blush','sonrojarse','wave','saludar','bath','bañarse','smug','presumir','smile','sonreir','highfive','choca','handhold','tomar','cringe','mueca','bonk','golpe','cry','llorar','lick','lamer','slap','bofetada','dance','bailar','cuddle','acurrucar','sing','cantar','tickle','cosquillas','scream','gritar','push','empujar','nope','no','jump','saltar','heat','calor','gaming','jugar','draw','dibujar','call','llamar','snuggle','acurrucarse','blowkiss','besito','trip','tropezar','stare','mirar','sniff','oler','curious','curioso','curiosa','thinkhard','pensar','comfort','consolar','peek','mirar','psycho','locura','poke','picar','cook','cocinar','lewd','provocativo','provocativa','greet','saludar','hola','hi','facepalm','palmada','frustracion'],
  category: 'anime',
  run: async (client, m, args, usedPrefix, command) => {
    const currentCommand = Object.keys(alias).find(key => alias[key].includes(command)) || command
    if (!captions[currentCommand]) return
    let mentionedJid = m.mentionedJid
    let who2 = mentionedJid.length > 0 ? mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender)
    const who = await resolveLidToRealJid(who2, client, m.chat)
    const fromName = global.db.data.users[m.sender]?.name || '@'+m.sender.split('@')[0]
    const toName = global.db.data.users[who]?.name || '@'+who.split('@')[0]
    const genero = global.db.data.users[m.sender]?.genre || 'Oculto'
    const captionText = captions[currentCommand](fromName, toName, genero)
    
    // 🖤 DISEÑO CHASKI GÓTICO MARIN KITAGAWA 🖤
    const topBorder = getRandomTopBorder()
    const bottomBorder = getRandomBottomBorder()
    const styledName = getRandomStyleName()
    const chaoskiMode = getRandomChaoskiDescription()
    const chaoskiAction = getRandomChaoskiAdjective()
    
    let caption;
    if (who !== m.sender) {
      caption = `${topBorder}
${styledName}

💬 ${chaoskiMode} 
${captionText}
${chaoskiAction} 💀

${bottomBorder}`
    } else {
      caption = `${topBorder}
${styledName}

💬 ${chaoskiMode}
${captionText}
${chaoskiAction} 💀

${bottomBorder}`
    }
    
    try {
    const response = await fetch(`https://tenor.googleapis.com/v2/search?q=anime+${encodeURIComponent(currentCommand)}&key=AIzaSyCY8VRFGjKZ2wpAoRTQ3faV_XcwTrYL5DA&limit=20`)
    const json = await response.json()
    const gifs = json.results
    if (!gifs || gifs.length === 0) throw new Error('No se encontraron resultados en ninguna API.')
    const media = gifs[Math.floor(Math.random() * gifs.length)].media_formats
    const url = media.mp4?.url || media.tinymp4?.url || media.loopedmp4?.url || media.gif?.url || media.tinygif?.url
    if (!url) throw new Error('No se encontró un formato compatible en Tenor.')  
    await client.sendMessage(m.chat, { video: { url }, gifPlayback: true, caption, mentions: [who, m.sender] }, { quoted: m })
    } catch (e) {
    await m.reply(`
💕 ────────────────── 💕
✦ ERROR EN LA EJECUCIÓN ✦
💕 ────────────────── 💕

💗 ${global.miku || 'HATSUNE MIKU'} 💗

Ocurrió un error inesperado en:
*${usedPrefix + command}*

💓 Intenta de nuevo...
❌ Error: *${e.message}* ❌

💕 ────────────────── 💕
    `.trim())
    }
  },
};
