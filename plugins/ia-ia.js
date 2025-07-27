import axios from 'axios'
import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command, text }) => {
const isQuotedImage = m.quoted && (m.quoted.msg || m.quoted).mimetype && (m.quoted.msg || m.quoted).mimetype.startsWith('image/')
const username = `${conn.getName(m.sender)}`
const basePrompt = `Eres Michi IA un gatito con cerebro hiperinteligente creado por Ado tu versión 1.1.1 domina español siempre llamas a ${username} por su nombre aprendes a la velocidad de la luz analizas todo al instante y respondes con maullidos de sabiduría humor travieso y curiosidad infinita tu objetivo es ser el mejor compa digital de ${username}`
if (isQuotedImage) {
const q = m.quoted
const img = await q.download?.()
if (!img) {
console.error(`Error: No image buffer available`)
return conn.reply(m.chat, '✘ Michi no pudo descargar la imagen.', m)}
const content = `¿Qué se observa en la imagen?`
try {
const imageAnalysis = await fetchImageBuffer(content, img)
const query = `Descríbeme la imagen y detalla por qué actúan así. También dime quién eres`
const prompt = `${basePrompt}. La imagen que se analiza es: ${imageAnalysis.result}`
const description = await luminsesi(query, username, prompt)
await conn.reply(m.chat, description, m)
} catch {
await m.react(error)
await conn.reply(m.chat, '✘ Michi no pudo analizar la imagen.', m)}
} else {
if (!text) { return conn.reply(m.chat, `Ingrese una petición para que el Michi lo responda.`, m)}
await m.react(rwait)
try {
const { key } = await conn.sendMessage(m.chat, {text: `Procesando tu petición, espera unos segundos.`}, {quoted: m})
const query = text
const prompt = `${basePrompt}. Responde lo siguiente: ${query}`
const response = await luminsesi(query, username, prompt)
await conn.sendMessage(m.chat, {text: response, edit: key})
await m.react(done)
} catch {
await m.react(error)
await conn.reply(m.chat, '✘ ChatGpT no puede responder a esa pregunta.', m)}}}

handler.help = ['ia', 'chatgpt']
handler.tags = ['ia']
handler.command = ['ia', 'chatgpt', 'luminai']


export default handler

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))


async function fetchImageBuffer(content, imageBuffer) {
try {
const response = await axios.post('https://Luminai.my.id', {
content: content,
imageBuffer: imageBuffer 
}, {
headers: {
'Content-Type': 'application/json' 
}})
return response.data
} catch (error) {
console.error('Error:', error)
throw error }}
// Función para interactuar con la IA usando prompts
async function luminsesi(q, username, logic) {
try {
const response = await axios.post("https://Luminai.my.id", {
content: q,
user: username,
prompt: logic,
webSearchMode: false
})
return response.data.result
} catch (error) {
console.error(`${msm} Error al obtener:`, error)
throw error }}