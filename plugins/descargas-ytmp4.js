import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return m.reply(`Usa: ${usedPrefix + command} <url>`)
  let url = args[0]
  let format = command === 'ytmp4' ? 'mp4' : 'mp3'
  let quality = '360'

  try {
    const userAgentList = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36'
    ]

    const apiUrl = `https://p.oceansaver.in/ajax/download.php?copyright=0&format=${format === 'mp4' ? quality : 'mp3'}&url=${url}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`
    let { data } = await axios.get(apiUrl, {
      headers: {
        'User-Agent': userAgentList[Math.floor(Math.random() * userAgentList.length)],
        'referer': 'https://y2mate.lol/en161/'
      }
    })

    if (!data.success) throw `No se pudo iniciar la descarga`

    let id = data.id
    let title = data.info.title
    let thumb = data.info.image

    let downloadUrl = ''
    while (true) {
      let { data: progress } = await axios.get(`https://p.oceansaver.in/ajax/progress.php?id=${id}`)
      if (progress.success && progress.progress >= 1000) {
        downloadUrl = progress.download_url
        break
      }
      await new Promise(res => setTimeout(res, 2000))
    }

    if (!downloadUrl) throw `No se pudo obtener el enlace`

    if (format === 'mp3') {
      await conn.sendMessage(m.chat, {
        audio: { url: downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, {
        video: { url: downloadUrl },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`,
        caption: title
      }, { quoted: m })
    }

  } catch (e) {
    console.error(e)
    m.reply(`Error: ${e}`)
  }
}

handler.help = ['ytmp3 <url>', 'ytmp4 <url>']
handler.tags = ['descargas']
handler.command = ['ytmp4, 'ytmp3']

export default handler