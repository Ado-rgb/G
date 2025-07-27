import fs from 'fs'
import path from 'path'
import ws from 'ws'

async function handler(m, { conn: stars }) {
  const socketsDir = path.join('./Sessions/Sockets')
  let activos = []

  if (!fs.existsSync(socketsDir)) {
    return await stars.sendMessage(m.chat, { text: 'No hay subbots registrados.' }, { quoted: m })
  }

  let dirs = fs.readdirSync(socketsDir).filter(d =>
    fs.statSync(path.join(socketsDir, d)).isDirectory()
  )

  for (let id of dirs) {
    let credsPath = path.join(socketsDir, id, 'creds.json')
    if (!fs.existsSync(credsPath)) continue

    try {
      let creds = JSON.parse(fs.readFileSync(credsPath))
      let jidFromFile = creds?.me?.jid || creds?.me?.id || id
      let name = creds?.me?.name || '-'

      // Limpiar el JID: quitar sufijos tipo ":43" y dejar solo el número
      let cleanJid = jidFromFile.split(':')[0].replace(/[^0-9]/g, '')

      // Buscar conexión activa en memoria
      let connObj = global.conns.find(c => {
        if (!c?.user?.id) return false
        let cleanConnJid = c.user.id.split(':')[0].replace(/[^0-9]/g, '')
        return cleanConnJid === cleanJid && c.ws?.socket?.readyState !== ws.CLOSED
      })

      if (connObj) {
        activos.push({ jid: cleanJid, name })
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
        `*${index + 1}.-* @${bot.jid}\n` +
        `*Link:* https://wa.me/${bot.jid}\n` +
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