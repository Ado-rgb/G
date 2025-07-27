let handler = async (m, { conn, isBotAdmin }) => {
  if (!m.isGroup) return
  let chat = global.db.data.chats[m.chat]
  if (!chat.antiarabe) return

  // Regex para caracteres árabes
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u1EE00-\u1EEFF]/
  // Prefijos de países árabes (sin +)
  const arabicPrefixes = ['212', '213', '20', '966', '971', '968', '964', '973', '965', '962', '218', '967', '973']

  if (!isBotAdmin) return m.reply('✿ *Antiárabe:* Necesito ser admin para revisar al grupo.')

  try {
    let participants = await conn.groupParticipants(m.chat)
    let toRemove = []

    for (let user of participants) {
      let number = user.split('@')[0]
      let contactName = await conn.getName(user)

      // Detectar si nombre tiene árabe o número tiene prefijo árabe
      let hasArabicChar = arabicRegex.test(contactName)
      let hasArabicPrefix = arabicPrefixes.some(pref => number.startsWith(pref))

      if (hasArabicChar || hasArabicPrefix) {
        // No remover admins ni al propio bot
        let isUserAdmin = false
        try {
          const metadata = await conn.groupMetadata(m.chat)
          const admins = metadata.participants.filter(p => p.admin !== null).map(p => p.id)
          isUserAdmin = admins.includes(user)
        } catch {}

        if (!isUserAdmin && user !== conn.user.jid) {
          toRemove.push(user)
        }
      }
    }

    if (toRemove.length === 0) {
      return m.reply('✿ *Antiárabe:* No se encontraron usuarios con caracteres o prefijos árabes para expulsar.')
    }

    for (let user of toRemove) {
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      m.reply(`✿ *Antiárabe:* Usuario @${user.split('@')[0]} expulsado por detección de árabe.`, null, { mentions: [user] })
    }

  } catch (e) {
    console.error(e)
    m.reply('✿ *Antiárabe:* Ocurrió un error al revisar el grupo.')
  }
}

export default handler