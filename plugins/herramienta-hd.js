import fetch from 'node-fetch'
import FormData from 'form-data'

async function uploadImage(buffer) {
  const form = new FormData()
  form.append('fileToUpload', buffer, 'image.jpg')
  form.append('reqtype', 'fileupload')

  const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Error al subir la imagen')
  return await res.text()
}

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    await m.react('🕓')

    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    if (!mime) return conn.reply(m.chat, `❀ Por favor, envía una imagen o responde a una imagen usando *${usedPrefix + command}*`, m)
    if (!/image\/(jpe?g|png|webp)/.test(mime)) return m.reply(`✧ El formato (${mime}) no es compatible, usa JPG, PNG o WEBP.`)

    conn.reply(m.chat, `✧ Mejorando tu imagen, espera...`, m)

    let img = await q.download?.()
    if (!img) throw new Error('No pude descargar la imagen.')

    let uploadedUrl = await uploadImage(img)

    const apiUrl = `https://fastapi.alifproject.cloud/api/ai/upscalev2?url=${encodeURIComponent(uploadedUrl)}`
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error(`Error en la API: ${res.statusText}`)
    const data = await res.json()

    if (data.status !== 'success' || !data.data?.result_url) throw new Error('No se pudo mejorar la imagen.')

    const improvedRes = await fetch(data.data.result_url)
    const buffer = await improvedRes.buffer()

    await conn.sendFile(m.chat, buffer, 'imagen_hd.jpg', '✅ *Imagen mejorada con éxito*', m)
    await m.react('✅')
  } catch (e) {
    console.error(e)
    await m.react('✖️')
    m.reply('❌ *Error al mejorar la imagen, inténtalo más tarde.*')
  }
}

handler.help = ['hd']
handler.tags = ['tools']
handler.command = ['remini', 'hd', 'enhance']

export default handler