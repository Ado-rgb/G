let handler = m => m

handler.before = async function (m, { conn }) {
  try {
    if (!m.isGroup) return
    const chat = globalThis?.db?.data?.chats?.[m.chat]
    if (!chat?.welcome) return

    if (!m.messageStubType || ![27, 28].includes(m.messageStubType)) return

    let user = m.messageStubParameters?.[0]
    if (!user) return

    let name = await conn.getName(user).catch(() => user.split('@')[0])
    let number = user.split('@')[0].replace(/[^0-9]/g, '')
    let pp = await conn.profilePictureUrl(user, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png')
    let groupName = await conn.getName(m.chat)

    let text = ''
    let title = ''
    let body = ''

    if (m.messageStubType === 27) {
      title = "Nuevo miembro ✨"
      body = "¡Nos alegra que estés aquí!"
      text = `*✩ Bienvenido/a (✿❛◡❛)!*  
❑ *Nombre ›* ${name}
✿ *Número ›* @${number}
♡ *Grupo ›* ${groupName}

> _Esperamos que disfrutes tu estadía y participes con respeto._`
    } else if (m.messageStubType === 28) {
      title = "Un miembro ha salido 👋"
      body = "Hasta pronto..."
      text = `*✩ Despedida (✿╥﹏╥)*  
❑ *Nombre ›* ${name}
✿ *Número ›* @${number}
♡ *Grupo ›* ${groupName}

> _Lamentamos tu partida, ¡te esperamos de vuelta algún día!_`
    }

    console.log(`[Welcome] Enviando mensaje a ${m.chat} para ${user}`)

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
  } catch (e) {
    console.error('[Welcome Error]', e)
  }
}

export default handler