import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const prompt = args.join(' ')
  if (!prompt) return m.reply(
`✿ Sigue las instrucciones :
✎ *Uso correcto ›* ${usedPrefix + command} < texto para la imagen >
✎ *Ejemplo ›* ${usedPrefix + command} gatito

Recuerda que la imagen puede tardar unos segundos en generarse.
↺ Sé paciente mientras se crea tu imagen.`)

  try {
    await m.react('🕒')

    const api = `https://myapiadonix.vercel.app/api/IAimagen?prompt=${encodeURIComponent(prompt)}`
    const res = await fetch(api)
    const json = await res.json()

    if (json.status !== 200 || !json.result?.image)
      throw new Error('No se pudo generar la imagen')

    await conn.sendMessage(m.chat, {
      image: { url: json.result.image },
      caption: `
» *Imagen Generada*

> _Detalles :_
✎ *Prompt ›* ${prompt}
↺ Disfruta.`.trim()
    }, { quoted: m })

    await m.react('✅')

  } catch (e) {
    console.error('Error generando imagen:', e)
    await m.react('✖️')
    m.reply('✿ *Error ›* No se pudo generar la imagen, inténtalo más tarde.')
  }
}

handler.command = ['imgia']
handler.help = ['imgia', 'iaimg']
handler.tags = ['ia']
handler.register = true

export default handler