let handler = m => m

handler.before = async function (m, { conn }) {
  if (!m.isGroup) return
  let chat = global.db.data.chats[m.chat]
  if (!chat || chat.welcome !== true) return

  // Solo mensajes de entrada (27) o salida (28)
  if (!m.messageStubType || ![27, 28].includes(m.messageStubType)) return

  let user = m.messageStubParameters[0]
  let name = await conn.getName(user)
  let pp = await conn.profilePictureUrl(user, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png')
  let groupName = await conn.getName(m.chat)

  let text = ''
  let title = ''
  let body = ''

  if (m.messageStubType === 27) {
    // Bienvenida
    title = "Nuevo miembro unido ✨"
    body = "¡Nos alegra que estés aquí!"
    text = `*✩ Bienvenido/a (✿❛◡❛)!*  
✿ *Usuario ›* @${user.split('@')[0]}
♡ *Grupo ›* ${groupName}

> _Esperamos que disfrutes tu estadía y participes con respeto._`
  } else if (m.messageStubType === 28) {
    // Despedida
    title = "Un miembro ha salido 👋"
    body = "Hasta pronto..."
    text = `*✩ Despedida (✿╥﹏╥)*  
✿ *Usuario ›* @${user.split('@')[0]}
♡ *Grupo ›* ${groupName}

> _Lamentamos tu partida, ¡te esperamos de vuelta algún día!_`
  }

  await conn.sendMessage(m.chat, {
    text: text,
    contextInfo: {
      mentionedJid: [user],
      externalAdReply: {
        title: title,
        body: body,
        thumbnailUrl: pp,
        sourceUrl: "https://myapiadonix.vercel.app",
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  })
}

export default handler