let handler = async (m, { conn, participants, groupMetadata, args }) => {
const pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => null) || './media/img/miniurl.mp4'
const groupAdmins = participants.filter(p => p.admin)
const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n💙 ')
const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || m.chat.split`-`[0] + '@s.whatsapp.net'

let text = `
≡ *Admis del grupo* _${groupMetadata.subject}_

┌─⊷ *ADMINISTRADORES*
🌱🧡 ${listAdmin}
└───────────
`.trim()
conn.sendFile(m.chat, pp, 'staff.png', text, m, false, { mentions: [...groupAdmins.map(v => v.id), owner] })
}
handler.help = ['staff', 'admins', 'administradores']
handler.tags = ['group']
handler.command = ['staff', 'admins', 'administradores'] 
handler.group = true
export default handler
