import fetch from 'node-fetch'

let handler = async (m, { conn, quoted, mime, usedPrefix, command, Format }) => {
  try {
    const isQuotedImage = quoted && ((quoted.msg || quoted).mimetype || '').startsWith('image/')
    const isImageDirect = (mime || '').startsWith('image/')

    if (!isQuotedImage && !isImageDirect) {
      return m.reply(`⚠️ Responde o envía una imagen (jpg, png, webp) con el comando *${usedPrefix + command}* para mejorarla.`)
    }

    // Checa si es reply a imagen o mensaje directo con imagen
    const mediaMsg = isQuotedImage ? quoted : m
    if (!mediaMsg) return m.reply('⚠️ No encontré la imagen, intenta de nuevo.')

    const mediaType = (mediaMsg.msg || mediaMsg).mimetype || ''
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)) {
      return m.reply('⚠️ Solo acepto imágenes JPG PNG o WEBP, bro.')
    }

    // Descarga la imagen
    m.react('🕒')
    const media = await conn.download(mediaMsg)
    // Sube la imagen a tu host o servicio
    const tmp = await Format.upload4(media)
    // Llama a la API de mejora
    const res = await fetch(`https://fastapi.alifproject.cloud/api/ai/upscalev2?url=${tmp}`)
    if (!res.ok) throw new Error(`Error API: ${res.statusText}`)
    const data = await res.json()

    m.reply('⏳ Mejorando tu imagen, espera un toque...')
    await conn.sendFile(m.chat, await (await fetch(data.data.result_url)).buffer(), '✅ Imagen mejorada con éxito', m)
    m.react('✅')

  } catch (e) {
    console.error(e)
    m.reply('❌ Error mejorando la imagen, intenta de nuevo más tarde.')
  }
}

handler.command = ['remini', 'hd', 'hdr']
handler.tags = ['tools', 'remini', 'hd']
handler.limit = false
handler.disabled = false

export default handler