// github.com/Ado-rgb
import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, args, command, usedPrefix }) => {
  if (!args[0]) return m.reply(`*ꕥ Uso correcto ›* ${usedPrefix + command} <enlace o nombre>`)

  try {
    let url = args[0]

    
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      let search = await yts(args.join(' '))
      if (!search.videos || search.videos.length === 0) return m.reply('*ꕥ No encontré resultados*')
      url = search.videos[0].url
    }

    let apiUrl = ''
    let isAudio = false

    if (command == 'play' || command == 'ytmp3') {
      apiUrl = `https://myapiadonix.vercel.app/api/ytmp3?url=${encodeURIComponent(url)}`
      isAudio = true
    } else if (command == 'play2' || command == 'ytmp4') {
      apiUrl = `https://myapiadonix.vercel.app/api/ytmp4?url=${encodeURIComponent(url)}`
    } else {
      return m.reply('*ꕥ Comando no reconocido*')
    }

    let res = await fetch(apiUrl)
    if (!res.ok) throw new Error('No se pudo conectar a la API')
    let json = await res.json()
    if (!json.success) throw new Error('No se pudo obtener la información del video')

    let { title, thumbnail, quality, download } = json.data

    // Mensaje con detalles decorados
    let details = `› *${title}*
⚥ Calidad › *${quality}*
⛁ Tipo › *${isAudio ? 'Audio' : 'Video'}*
❒ Fuente › *YouTube*
    `.trim()

    await conn.sendMessage(m.chat, { 
      text: details, 
      contextInfo: { 
        externalAdReply: { 
          title: globalThis.botname, 
          body: '',
          thumbnailUrl: thumbnail,
          sourceUrl: 'https://whatsapp.com/channel/0029VbArz9fAO7RGy2915k3O',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })

    // Enviar archivo
    if (isAudio) {
      await conn.sendMessage(m.chat, { 
        audio: { url: download }, 
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        ptt: true
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, { 
        video: { url: download }, 
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`
      }, { quoted: m })
    }

  } catch (e) {
    console.error(e)
    m.reply('*ꕥ Ocurrió un error al procesar tu solicitud*')
  }
}

handler.help = ['play', 'ytmp3', 'play2', 'ytmp4'].map(v => v + '')
handler.tags = ['descargas']
handler.command = ['play', 'play2']

export default handler