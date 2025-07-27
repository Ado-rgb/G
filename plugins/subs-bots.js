import fs from 'fs'
import path from 'path'
import ws from 'ws' // Para revisar si el WebSocket está activo

async function handler(m, { conn: stars, usedPrefix }) {
  let uniqueUsers = new Map()

  // Iterar sobre todas las conexiones en global.conns
  global.conns.forEach((conn) => {
    // Carpeta donde deberían estar las credenciales del subbot
    let sessionPath = path.join('./Sessions/Sockets', conn.user?.id || '')
    let credsPath = path.join(sessionPath, 'creds.json')

    // Comprobar si la sesión existe (tiene creds.json) y si el socket está activo
    let isActive =
      fs.existsSync(credsPath) &&
      conn.user &&
      conn.ws?.socket &&
      conn.ws.socket.readyState !== ws.CLOSED

    if (isActive) {
      uniqueUsers.set(conn.user.jid, conn) // Guardar en el Map para evitar duplicados
    }
  })

  // Convertir los subbots activos a array
  let users = [...uniqueUsers.values()]

  // Crear el mensaje formateado
  let message = users
    .map(
      (v, index) =>
        `*${index + 1}.-* @${v.user.jid.replace(/[^0-9]/g, '')}\n` +
        `*Link:* https://wa.me/${v.user.jid.replace(/[^0-9]/g, '')}\n` +
        `*Nombre:* ${v.user.name || '-'}\n` +
        `*Estado:* Activo ✅`
    )
    .join('\n\n')

  // Mensaje si no hay subbots
  let replyMessage =
    message.length === 0
      ? 'No hay SubBots conectados en este momento.'
      : message

  let totalUsers = users.length
  let responseMessage = `*Total de SubBots:* ${totalUsers}\n\n${replyMessage.trim()}`.trim()

  // Enviar mensaje con menciones
  await stars.sendMessage(
    m.chat,
    { text: responseMessage, mentions: stars.parseMention(responseMessage) },
    { quoted: m }
  )
}

handler.command = ['listjadibot', 'bots']
handler.help = ['bots']
handler.tags = ['subbots']
export default handler