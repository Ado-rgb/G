import ws from 'ws' // Make sure ws is imported if you haven't already globally or at the top of your main file

async function handler(m, { conn: stars, usedPrefix }) {
  let uniqueUsers = new Map()

  // Iterate over all connections currently in global.conns
  global.conns.forEach((conn) => {
    // Check if the connection object exists, has a user object,
    // and its websocket is not in a closed state.
    // The 'readyState !== ws.CLOSED' check is good for ensuring active connections.
    // conn.user will only be present if the connection has successfully authenticated.
    if (conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED) {
      // Use the JID as a key to ensure uniqueness, avoiding duplicates if any.
      uniqueUsers.set(conn.user.jid, conn)
    }
  })

  // Get the values (the connection objects) from the uniqueUsers Map
  let users = [...uniqueUsers.values()]

  // Map the connected sub-bot data into a formatted message string
  let message = users.map((v, index) => 
    `*${index + 1}.-* @${v.user.jid.replace(/[^0-9]/g, '')}\n` +
    `*Link:* https://wa.me/${v.user.jid.replace(/[^0-9]/g, '')}\n` +
    `*Nombre:* ${v.user.name || '-'}`
  ).join('\n\n')

  // Prepare the reply message
  let replyMessage = message.length === 0 ? 'No hay SubBots conectados en este momento.' : message // Added a message for no bots
  let totalUsers = users.length
  let responseMessage = `*Total de SubBots* : ${totalUsers}\n\n${replyMessage.trim()}`.trim() // Changed '0' to totalUsers for accuracy

  // Send the message, including mentions
  await stars.sendMessage(m.chat, { text: responseMessage, mentions: stars.parseMention(responseMessage) }, { quoted: m })
}

handler.command = ['listjadibot', 'bots']
handler.help = ['bots']
handler.tags = ['subbots']
export default handler
