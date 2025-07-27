let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!m.isGroup) throw '❌ Este comando solo funciona en grupos'

  let users = []

  // 1. Si mencionan usuarios
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    users = m.mentionedJid
  }
  // 2. Si responden un mensaje
  else if (m.quoted) {
    users = [m.quoted.sender]
  }
  // 3. Si ponen número directamente
  else if (text) {
    let number = text.replace(/[^0-9]/g, '') // solo dígitos
    if (!number) throw `Formato incorrecto\nEjemplo:\n${usedPrefix + command} 50493059810`
    users = [`${number}@s.whatsapp.net`]
  }

  if (users.length === 0) {
    throw `Etiqueta a alguien, responde un mensaje o escribe el número\nEjemplo:\n${usedPrefix + command} @usuario\n${usedPrefix + command} 50493059810`
  }

  try {
    await conn.groupParticipantsUpdate(m.chat, users, 'promote')
    await m.reply(
      `✅ Ahora ${users.map(u => '@' + u.split('@')[0]).join(', ')} es admin`,
      null,
      { mentions: users }
    )
  } catch (e) {
    throw '❌ No pude dar admin, ¿el bot es admin?'
  }
}

handler.help = ['promote']
handler.tags = ['group']
handler.command = ['promote']
handler.group = true
handler.admin = teue

export default handler