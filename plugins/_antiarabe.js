let handler = async (m, { conn, isBotAdmin }) => {
  if (!m.isGroup) return
  let chat = global.db.data.chats[m.chat]
  if (!chat || chat.antiarabe !== true) return

  // Regex para caracteres árabes
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u1EE00-\u1EEFF]/
  // Prefijos de países árabes (sin +)
  const arabicPrefixes = ['212', '213', '20', '966', '971', '968', '964', '973', '965', '962', '218', '967']

  if (!isBotAdmin) return m.reply('✿ *Antiárabe:* Necesito ser admin para expulsar.')

  try {
    const metadata = await conn.groupMetadata(m.chat)
    const participants = metadata.participants.map(p => p.id)
    const admins = metadata.participants.filter(p => p.admin !== null).map(p => p.id)

    let toRemove = []

    for (let user of participants) {
      let number = user.split('@')[0]
      let contactName = await conn.getName(user)

      let hasArabicChar = arabicRegex.test(contactName)
      let hasArabicPrefix = arabicPrefixes.some(pref => number.startsWith(pref))

      if ((hasArabicChar || hasArabicPrefix) && !admins.includes(user) && user !== conn.user.jid) {
        toRemove.push(user)
      }
    }

    if (toRemove.length === 0) return

    for (let user of toRemove) {
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      await conn.sendMessage(m.chat, { 
        text: `✿ *Antiárabe:* Usuario @${user.split('@')[0]} expulsado por detección de árabe.`,
        mentions: [user]
      })
    }

  } catch (e) {
    console.error(e)
  }
}

export default handler