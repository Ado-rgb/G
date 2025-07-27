import fs from 'fs'
import path from 'path'
import ws from 'ws'

async function handler(m, { conn: stars }) {
  const socketsDir = path.join('./Sessions/Sockets')
  let activos = []

  if (!fs.existsSync(socketsDir)) {
    return await stars.sendMessage(m.chat, { text: 'No hay subbots registrados.' }, { quoted: m })
  }

  let dirs = fs.readdirSync(socketsDir).filter(d => {
    let dirPath = path.join(socketsDir, d)
    return fs.statSync(dirPath).isDirectory()
  })

  for (let id of dirs) {
    let credsPath = path.join(socketsDir, id, 'creds.json')
    if (!fs.existsSync(credsPath)) continue

    try {
      let creds = JSON.parse(fs.readFileSync(credsPath))
      let jid = creds?.me?.id || id
      let name = creds?.me?.name || '-'

      // Validar si está en memoria y activo
      let connObj = global.conns.find(c => c?.user?.id === jid || c?.user?.jid === jid)
      if (connObj && connObj.ws?.socket && connObj.ws.socket.readyState !== ws.CLOSED) {
        activos.push({ id, jid, name })
      }
    } catch (e) {
      console.log(`Error leyendo ${id}:`, e.message)
    }
  }

  if (activos.length === 0) {
    return await stars.sendMessage(m.chat, { text: 'No hay subbots activos en este momento.' }, { quoted: m })
  }

  let text = activos
    .map(
      (bot, index) =>
        `*${index + 1}.-* @${bot.jid.replace(/[^0-9]/g, '')}\n` +
        `*Link:* https://wa.me/${bot.jid.replace(/[^0-9]/g, '')}\n` +
        `*Nombre:* ${bot.name}`
    )
    .join('\n\n')

  let response = `*Total de SubBots activos:* ${activos.length}\n\n${text}`
  await stars.sendMessage(m.chat, { text: response, mentions: stars.parseMention(response) }, { quoted: m })
}

handler.command = ['listjadibot', 'bots']
handler.help = ['bots']
handler.tags = ['subbots']
export default handler