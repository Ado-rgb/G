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
    
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const api = `https://myapiadonix.vercel.app/api/IAimagen?prompt=${encodeURIComponent(prompt)}`
    const res = await fetch(api)
    const json = await res.json()

    if (json.status !== 200 || !json.result?.image)
      throw new Error('No se pudo generar la imagen')

    await conn.sendMessage(m.chat, {
      image: { url: json.result.image },
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
handler.help = ['imgia <texto>']
handler.tags = ['ia']

export default handler