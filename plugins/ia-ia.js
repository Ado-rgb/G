import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `❀ *Uso correcto ›* ${usedPrefix + command} <pregunta>`, m)
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })
    await conn.sendPresenceUpdate('composing', m.chat)

    const api = `https://apis-starlights-team.koyeb.app/starlight/gemini?text=${encodeURIComponent(text)}`
    const res = await fetch(api)
    const json = await res.json()

    if (!json.result) throw new Error('Sin respuesta.')

    await conn.sendMessage(m.chat, {
      text: `> ${json.result}`
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  } catch (e) {
    console.error('Error en Gemini:', e)
    await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } })
    await conn.reply(m.chat, `⚠︎ Gemini no pudo responder a esa pregunta.`, m)
  }
}

handler.command = ['ia']
handler.help = ['ia']
handler.tags = ['ia']

export default handler