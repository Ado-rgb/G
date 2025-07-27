import fs from 'fs'
import path from 'path'
import ws from 'ws'

async function handler(m, { conn: stars }) {
  const socketsDir = path.join('./Sessions/Sockets')
  let subbots = []

  if (!fs.existsSync(socketsDir)) {
    return await stars.sendMessage(m.chat, { text: 'No hay subbots registrados.' }, { quoted: m })
  }

  // Recorremos todas las carpetas en ./Sessions/Sockets/
  let dirs = fs.readdirSync(socketsDir).filter(d => {
    let dirPath = path.join(socketsDir, d)
    return fs.statSync(dirPath).isDirectory()
  })

  dirs.forEach(id => {
    let credsPath = path.join(socketsDir, id, 'creds.json')
    let hasCreds = fs.existsSync(credsPath)

    // Buscar si está en memoria (global.conns)
    let connObj = global.conns.find(c => c?.user?.id === id || c?.user?.jid?.includes(id))

    let isActive =
      hasCreds &&
      connObj &&
      connObj.ws?.socket &&
      connObj.ws.socket.readyState !== ws.CLOSED

    subbots.push({
      id,
      jid: connObj?.user?.jid || id,
      name: connObj?.user?.name || '-',
      active: isActive,
      hasSession: hasCreds
    })
  })

  if (subbots.length === 0) {
    return await stars.sendMessage(m.chat, { text: 'No hay SubBots registrados.' }, { quoted: m })
  }

  // Crear mensaje
  let text = subbots
    .map(
      (bot, index) =>
        `*${index + 1}.-* @${bot.jid.replace(/[^0-9]/g, '')}\n` +
        `*ID:* ${bot.id}\n` +
        `*Link:* https://wa.me/${bot.jid.replace(/[^0-9]/g, '')}\n` +
        `*Nombre:* ${bot.name}\n` +
        `*Estado:* ${bot.active ? 'Activo ✅' : bot.hasSession ? 'Inactivo ❌' : 'Sin sesión 🕳️'}`
    )
    .join('\n\n')

  let total = subbots.length
  let response = `*Total de SubBots:* ${total}\n\n${text}`

  await stars.sendMessage(m.chat, { text: response, mentions: stars.parseMention(response) }, { quoted: m })
}

handler.command = ['listjadibot', 'bots']
handler.help = ['bots']
handler.tags = ['subbots']
export default handler