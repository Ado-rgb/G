import fetch from 'node-fetch'

const handler = async (m, { conn, usedPrefix, command, Format }) => {
  try {
    await m.react('🕓')

    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    if (!mime) return conn.reply(m.chat, `❀ Por favor, envía una imagen o responde a una imagen usando *${usedPrefix + command}*`, m)
    if (!/image\/(jpe?g|png|webp)/.test(mime)) return m.reply(`✧ El formato del archivo (${mime}) no es compatible, usa JPG, PNG o WEBP.`)

    conn.reply(m.chat, `✧ Mejorando la calidad de tu imagen, espera un momento...`, m)

    // Descarga la imagen
    let img = await q.download?.()
    if (!img) throw new Error('No pude descargar la imagen.')

    // Sube la imagen a tu host temporal
    let uploadedUrl = await Format.upload4(img)

    // Llama a la API
    const apiUrl = `https://fastapi.alifproject.cloud/api/ai/upscalev2?url=${encodeURIComponent(uploadedUrl)}`
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error(`Error en la API: ${res.statusText}`)
    const data = await res.json()

    if (data.status !== 'success' || !data.data?.result_url) throw new Error('No se pudo mejorar la imagen.')

    // Descarga la imagen mejorada
    const improvedRes = await fetch(data.data.result_url)
    const buffer = await improvedRes.buffer()

    await conn.sendFile(m.chat, buffer, 'imagen_hd.jpg', '✅ *Imagen mejorada con éxito*', m)

    await m.react('✅')
  } catch (e) {
    console.error(e)
    await m.react('✖️')
    m.reply('❌ *Error al mejorar la imagen, intenta de nuevo más tarde.*')
  }
}

handler.help = ['hd']
handler.tags = ['tools']
handler.command = ['remini', 'hd', 'enhance']

export default handler