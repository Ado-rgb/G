import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command, mime, quoted, Format, isPremium, db }) => {
  if (/image|webp/.test(mime) || m.mtype === 'imageMessage' || m.mtype === 'stickerMessage') {
    if (!m.isGroup && !isPremium)
      return m.reply('⚠️ Esta función HD en chats privados solo está disponible para usuarios premium.')

    if (m.isGroup && !db.chats[m.chat].hd)
      return conn.reply(
        m.chat,
        '⚠️ La función HD está desactivada para este grupo.\nPara activarla usa: *.on hd*',
        m
      )

    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const media = await conn.download(quoted)
    const tmpUrl = await Format.upload4(media)
    const res = await fetch(`https://fastapi.alifproject.cloud/api/ai/upscalev2?url=${tmpUrl}`)
    if (!res.ok) return m.reply(`❌ Error al procesar la imagen: ${res.statusText}`)

    const data = await res.json()

    await m.reply('⏳ Mejorando tu imagen, por favor espera...')

    const imgBuffer = await (await fetch(data.data.result_url)).buffer()

    await conn.sendMessage(m.chat, { image: imgBuffer, caption: '✅ Imagen mejorada con éxito' }, { quoted: m })

  } else {
    return m.reply(`⚠️ Responde o envía una imagen con el comando *${usedPrefix + command}* para mejorarla.`)
  }
}

handler.command = ['remini', 'hd', 'hdr']

export default handler