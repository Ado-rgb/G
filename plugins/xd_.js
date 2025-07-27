let handler = async (m, { conn, usedPrefix, command }) => {
  // Verificamos que sea chat privado
  if (m.isGroup) return m.reply('✿ Este comando solo funciona en privado')

  let jid = m.sender // número del usuario que envió el mensaje

  try {
    await conn.query({
      tag: 'iq',
      attrs: {
        to: jid,
        type: 'set',
        xmlns: 'jabber:iq:call'
      },
      content: [{
        tag: 'call',
        attrs: {
          type: 'offer'
        },
        content: [{
          tag: 'offer',
          attrs: {
            'call-id': Date.now().toString(),
            'sdp': 'v=0\r\n' // Oferta básica
          }
        }]
      }]
    })
    m.reply(`📞 Llamando a ${jid.split('@')[0]}...`)
  } catch (err) {
    console.error(err)
    m.reply('❌ *Error:* No se pudo realizar la llamada')
  }
}

handler.help = ['ll']
handler.tags = ['owner']
handler.command = /^ll$/i
handler.owner = true

export default handler