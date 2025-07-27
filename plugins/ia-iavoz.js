import fetch from 'node-fetch'

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

let handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) return conn.reply(m.chat, `🗣️ Mande un texto pa que Adonix le hable al toque`, m)

  try {
    await conn.sendPresenceUpdate('recording', m.chat)

    const res = await fetch(`https://myapiadonix.vercel.app/api/adonixvoz?q=${encodeURIComponent(text)}`)

    if (!res.ok) throw new Error('No pude obtener audio de Adonix')

    const bufferAudio = await streamToBuffer(res.body)

    await conn.sendMessage(m.chat, {
      audio: bufferAudio,
      mimetype: 'audio/mpeg',
      ptt: true
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '❌ Error al generar la voz, intentalo otra vez', m)
  }
}

handler.command = ['iavoz']
handler.help = ['iavoz']
handler.tags = ['ia']
export default handler