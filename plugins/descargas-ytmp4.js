import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('❗ Ingresa el enlace de YouTube')

  try {
    await m.react('⏳') // reacción mientras descarga

    let apiUrl = `https://fastapi.alifproject.cloud/api/downloader/ytmp4?url=${encodeURIComponent(text)}`
    let res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Authorization': 'Bearer alif_1c803321-f87f-4ba5-9f9d-0b7b54930be8'
      }
    })

    let json = await res.json()
    if (json.status !== 'success') throw json

    let videoUrl = json.data.result_url || json.data.url || json.result

    await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption: '🎬 *Aquí está tu video*' }, { quoted: m })
    await m.react('✅')
  } catch (e) {
    console.error(e)
    m.reply('❌ No se pudo descargar el video.')
  }
}

handler.help = ['ytmp4']
handler.tags = ['descargas']
handler.command = /^ytmp4$/i

export default handler