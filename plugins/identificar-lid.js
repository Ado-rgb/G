const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid
  const senderId = msg.key.participant || msg.key.remoteJid

  // Reacción inicial
  await conn.sendMessage(chatId, {
    react: { text: '🔰', key: msg.key }
  })

  // Extraer el ID citado o usar el que envió el mensaje
  const context = msg.message?.extendedTextMessage?.contextInfo
  const citado = context?.participant
  const objetivo = citado || senderId
  const numero = objetivo.replace(/[^0-9]/g, '')

  const mensaje = `
✩ *Información del usuario detectado:*

> 👤 @⁨+${numero}⁩
> 🆔 Identificador: *${objetivo}*
> 🔐 Tipo de cuenta: *${objetivo.endsWith('@lid') ? 'LID oculto (@lid)' : 'Número visible (@s.whatsapp.net)'}*

`.trim()

  await conn.sendMessage(chatId, {
    text: mensaje,
    mentions: [objetivo]
  }, { quoted: msg })
}

handler.command = ['milid']
handler.group = true
handler.private = false

export default handler