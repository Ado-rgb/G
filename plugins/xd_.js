let handler = async (m, { conn }) => {
  try {
    const jid = m.chat // usuario que envió el mensaje
    const callId = Date.now().toString()

    await conn.sendMessage(jid, {
      call: {
        callId: callId,
        offer: {
          'sdp': 'fake_sdp_data',
          'type': 'offer'
        }
      }
    })

    m.reply('📞 *Fake Call enviada* (esto no es una llamada real, solo simulación)')
  } catch (e) {
    console.log(e)
    m.reply('❌ Error al enviar la fake call')
  }
}

handler.command = ['ll']
handler.help = ['ll']
handler.tags = ['fun']

export default handler