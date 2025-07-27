import axios from 'axios'
import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command, text }) => {
  const isQuotedImage = m.quoted && (m.quoted.msg || m.quoted).mimetype && (m.quoted.msg || m.quoted).mimetype.startsWith('image/')
  const username = await conn.getName(m.sender) || 'amigx'
  const basePrompt = `Tu nombre es Michi AI, soy la inteligencia más brillante y divertida creada por Wirk. Mi versión actual es 1.0, hablo Español al chile. Siempre te llamaré por tu nombre ${username}, me encanta aprender, hacer reír y ayudar sin fallo.`

  if (isQuotedImage) {
    const q = m.quoted
    const img = await q.download?.()
    if (!img) {
      console.error('⚠️ Error: No pude descargar la imagen 😿')
      return conn.reply(m.chat, '✘ Michi AI no pudo descargar la imagen, intenta otra vez wey.', m)
    }
    const content = `👀 Oye Michi AI, dime qué ves en esta imagen, sé detallado y explícale al usuario por qué actúan así.`
    try {
      const imageAnalysis = await fetchImageBuffer(content, img)
      const query = `🔍 Descríbeme la imagen, explica lo que sucede y dime quién eres tú.`
      const prompt = `${basePrompt}. Aquí está la imagen que analizamos: ${imageAnalysis.result}`
      const description = await luminsesi(query, username, prompt)
      await conn.reply(m.chat, `✨ *Michi AI dice:* \n\n${description}`, m)
    } catch {
      await m.react('❌')
      await conn.reply(m.chat, '✘ Michi AI tuvo un error analizando la imagen, pero seguimos intentando.', m)
    }
  } else {
    if (!text) return conn.reply(m.chat, `✋ Oye ${username}, dime qué quieres que haga, no me dejes en blanco. Usa:\n\n${usedPrefix}${command} <tu pregunta>`, m)
    await m.react('⏳')
    try {
      const sentMsg = await conn.sendMessage(m.chat, { text: `🤖 Michi AI está pensando en la respuesta perfecta para ti... espera un toque.` }, { quoted: m })
      const query = text
      const prompt = `${basePrompt}. Responde lo siguiente de la forma más completa y divertida: ${query}`
      const response = await luminsesi(query, username, prompt)
      await conn.sendMessage(m.chat, { text: `✨ *Michi AI responde:* \n\n${response}` }, { quoted: sentMsg })
      await m.react('✅')
    } catch {
      await m.react('❌')
      await conn.reply(m.chat, '✘ Michi AI no pudo responder a esa pregunta pero seguirá mejorando, aguanta.', m)
    }
  }
}

handler.help = ['ia']
handler.tags = ['ia']
handler.command = ['ia', 'chatgpt', 'michiai']

export default handler

// Delay helper si quieres pa futuras cosas
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Función para enviar imagen y obtener análisis de LuminAI
async function fetchImageBuffer(content, imageBuffer) {
  try {
    const response = await axios.post('https://Luminai.my.id', {
      content,
      imageBuffer
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  } catch (error) {
    console.error('⚠️ Error en fetchImageBuffer:', error)
    throw error
  }
}

// Función para chatear con LuminAI usando prompts
async function luminsesi(q, username, logic) {
  try {
    const response = await axios.post('https://Luminai.my.id', {
      content: q,
      user: username,
      prompt: logic,
      webSearchMode: false
    })
    return response.data.result
  } catch (error) {
    console.error('⚠️ Error en luminsesi:', error)
    throw error
  }
}