let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!m.isGroup) return m.reply('✿ Este comando solo funciona en grupos')

  let chat = global.db.data.chats[m.chat]
  if (args.length < 1) {
    return m.reply(
`✿ *Uso correcto ›* ${usedPrefix + command} on/off

> Activa o desactiva los mensajes de bienvenida y despedida.`
    )
  }

  if (args[0].toLowerCase() === 'on') {
    chat.welcome = true
    m.reply('✿ *Welcome activado* en este grupo ✨')
  } else if (args[0].toLowerCase() === 'off') {
    chat.welcome = false
    m.reply('✿ *Welcome desactivado* ❌')
  } else {
    m.reply(`✿ Opción no válida, usa: ${usedPrefix + command} on/off`)
  }
}

handler.command = ['welcome']
handler.help = ['welcome on/off']
handler.tags = ['group']

export default handler

// --- Listener de bienvenida y despedida ---
export async function before(m, { conn }) {
  if (!m.isGroup) return
  let chat = global.db.data.chats[m.chat]
  if (!chat?.welcome) return

  // Solo cuando alguien entra o sale
  if (![27, 28].includes(m.messageStubType)) return

  let user = m.messageStubParameters?.[0]
  if (!user) return

  let name = await conn.getName(user).catch(() => user.split('@')[0])
  let pp = await conn.profilePictureUrl(user, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png')
  let groupName = await conn.getName(m.chat)

  let title, body, text

  if (m.messageStubType === 27) {
    title = "Nuevo miembro ✨"
    body = "¡Nos alegra que estés aquí!"
    text = `*✩ Bienvenido/a (✿❛◡❛)!*  
❑ *Nombre ›* ${name}
✿ *Número ›* @${user.split('@')[0]}
♡ *Grupo ›* ${groupName}`
  } else {
    title = "Un miembro ha salido 👋"
    body = "Hasta pronto..."
    text = `*✩ Despedida (✿╥﹏╥)*  
❑ *Nombre ›* ${name}
✿ *Número ›* @${user.split('@')[0]}
♡ *Grupo ›* ${groupName}`
  }

  await conn.sendMessage(m.chat, {
    text,
    contextInfo: {
      mentionedJid: [user],
      externalAdReply: {
        title,
        body,
        thumbnailUrl: pp,
        sourceUrl: "https://myapiadonix.vercel.app",
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  })
}