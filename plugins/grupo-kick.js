let handler = async (m, { conn, args }) => {
  if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')

  let user = m.mentionedJid?.[0] 
          || m.quoted?.sender 
          || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

  if (!user) return m.reply('✿ *Uso correcto ›* .kick @usuario o responde a un mensaje')

  try {
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
    await conn.sendMessage(m.chat, { 
      text: `✿ *Kick:* Usuario @${user.split('@')[0]} expulsado.`,
      mentions: [user]
    })
  } catch {
    m.reply('❌ No pude expulsar al usuario (quizás no soy admin o pasó otro error)')
  }
}

handler.command = ['kick']
handler.help = ['kick']
handler.tags = ['grupos']
handler.admin = true

export default handler