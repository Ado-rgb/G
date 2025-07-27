let handler = m => m

handler.before = async function (m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  let chat = global.db.data.chats[m.chat]
  if (!chat.antiarabe) return

  // Regex para caracteres árabes
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u1EE00-\u1EEFF]/
  // Prefijos de países árabes
  const arabicPrefixes = ['+212', '+213', '+20', '+966', '+971', '+968', '+964', '+973', '+965', '+962', '+218', '+967', '+973']

  try {
    let shouldKick = false
    let senderNumber = m.sender.split('@')[0]

    // Detectar si mensaje contiene árabe
    if (arabicRegex.test(m.text)) shouldKick = true

    // Detectar si mensaje empieza con un prefijo árabe
    if (m.text && m.text.trim().length > 0 && arabicRegex.test(m.text.charAt(0))) shouldKick = true

    // Detectar si nombre o descripción del perfil contienen árabe
    const contact = await conn.fetchStatus(m.sender).catch(() => ({}))
    if (arabicRegex.test(contact?.status || '') || arabicRegex.test(m.pushName)) shouldKick = true

    // Detectar prefijo del número
    for (let prefix of arabicPrefixes) {
      if (senderNumber.startsWith(prefix.replace('+', ''))) shouldKick = true
    }

    if (shouldKick) {
      if (!isBotAdmin) return m.reply('✿ *Antiárabe:* Necesito ser admin para expulsar.')
      if (isAdmin) return // No expulsar admins

      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
      await m.reply(
        `*✿ Antiárabe Activo*\n@${senderNumber} fue eliminado por detección de árabe.`,
        null,
        { mentions: [m.sender] }
      )
    }
  } catch (err) {
    console.error(err)
  }
}

export default handler