import fetch from 'node-fetch'

let handler = async (m, { conn, quoted, usedPrefix, command, Format }) => {
  try {
    if (!quoted) return m.reply(`⚠️ Responde a una imagen con el comando *${usedPrefix + command}* para mejorarla.`)

    let msgQuoted = quoted.msg ? quoted.msg : quoted
    let mime = msgQuoted.mimetype || ''

    if (!mime || !mime.startsWith('image/')) 
      return m.reply(`⚠️ El archivo debe ser una imagen válida (png, jpg, jpeg, webp). Usa el comando *${usedPrefix + command}* respondiendo a una imagen.`)

    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const media = await conn.download(msgQuoted)
    const tmpUrl = await Format.upload4(media)

    const res = await fetch(`https://fastapi.alifproject.cloud/api/ai/upscalev2?url=${tmpUrl}`)
    if (!res.ok) return m.reply(`❌ Error al procesar la imagen: ${res.statusText}`)

    const data = await res.json()

    await m.reply('⏳ Mejorando tu imagen, por favor espera...')

    const imgResp = await fetch(data.data.result_url)
    const imgBuffer = await imgResp.buffer()

    await conn.sendMessage(m.chat, { image: imgBuffer, caption: '✅ Imagen mejorada con éxito' }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('❌ Error al mejorar la imagen, intenta de nuevo más tarde.')
  }
}

handler.command = ['remini', 'hd', 'hdr']
handler.tags = ['tools', 'remini', 'hd']
handler.limit = false
handler.disable = false

export default handler