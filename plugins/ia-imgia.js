import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const prompt = args.join(' ')
  if (!prompt) return m.reply(
`✿ *Generador de Imágenes AI*

Sigue las instrucciones:
✎ *Uso correcto ›* ${usedPrefix + command} <texto para la imagen>
✎ *Ejemplo ›* ${usedPrefix + command} gatito kawaii con fondo rosa

Recuerda que la imagen puede tardar unos segundos en generarse.
↺ Sé paciente mientras se crea tu imagen.`)

  try {
    // Reaccionar con reloj mientras genera
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    // Llamada a tu API que devuelve la imagen directamente
    const api = `https://myapiadonix.vercel.app/api/IAimagen?prompt=${encodeURIComponent(prompt)}`
    const res = await fetch(api)
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`)

    // Convertir la respuesta en buffer (imagen)
    const buffer = await res.buffer()

    // Enviar la imagen al chat
    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: `
✿ *¡Imagen Generada!*

Detalles:
✎ *Prompt ›* ${prompt}
↺ Disfruta tu nueva creación.
`.trim()
    }, { quoted: m })

    // Reaccionar con check
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('Error generando imagen:', e)
    await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } })
    m.reply('✿ *Error ›* No se pudo generar la imagen, inténtalo más tarde.')
  }
}

handler.command = ['imgia']
handler.help = ['imgia']
handler.tags = ['ia']

export default handler