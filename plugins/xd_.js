let handler = async (m, { conn }) => {
  try {
    const jid = m.chat // JID del usuario que te escribió en privado
    const username = await conn.getName(jid)

    await conn.sendMessage(jid, {
      text: `📞 *Opciones para ${username}*\n\n¿Qué quieres hacer con este contacto?`,
      footer: 'Adonix Bot',
      templateButtons: [
        { index: 1, quickReplyButton: { displayText: '💬 Mandar Mensaje', id: `.msg ${jid} Hola!` } },
        { index: 2, quickReplyButton: { displayText: '🖼️ Mandar Sticker', id: `.sticker ${jid}` } },
        { index: 3, quickReplyButton: { displayText: '🚫 Bloquear/Desbloquear', id: `.block ${jid}` } },
        { index: 4, quickReplyButton: { displayText: 'ℹ️ Info del Número', id: `.whois ${jid}` } }
      ]
    })
  } catch (e) {
    console.log(e)
    m.reply('❌ Error al enviar las opciones')
  }
}

handler.command = ['ll']
handler.help = ['ll']
handler.tags = ['tools']

export default handler