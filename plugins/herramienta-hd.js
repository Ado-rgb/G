import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command, mime, quoted, Format }) => {
  if (!(/image|webp/.test(mime) || m.mtype === 'imageMessage' || m.mtype === 'stickerMessage'))
    return m.reply(`⚠️ Responde o envía una imagen con el comando *${usedPrefix + command}* para mejorarla.`)

  try {
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const media = await conn.download(quoted)
    const tmpUrl = await Format.upload4(media)

    const res = await fetch(`https://fastapi.alifproject.cloud/api/ai/upscalev2?url=${tmpUrl}`)
    if (!res.ok) return m.reply(`❌ Error al procesar la imagen: ${res.statusText}`)

    const data = await res.json()

    await m.reply('⏳ Mejorando tu imagen, por favor espera...')

    const imgBuffer = await (await fetch(data.data.result_url)).buffer()

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