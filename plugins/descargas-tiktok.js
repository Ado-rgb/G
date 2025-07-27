import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return m.reply(`¿Cómo usar?
✎ ${usedPrefix + command} <link válido de TikTok>

Ejemplo:
> ${usedPrefix + command} https://www.tiktok.com/@usuario/video/123456789`)

  try {
    // Reaccionar mientras procesa
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    // Llamar API
    let apiURL = `https://myapiadonix.vercel.app/api/tiktok?url=${encodeURIComponent(args[0])}`
    let response = await fetch(apiURL)
    let data = await response.json()

    if (data.status !== 200 || !data.result?.video)
      throw new Error('No se pudo obtener el video')

    let info = data.result

    
    let caption = `
*✩ TikTokInfo (✿❛◡❛)*
*❑ Título ›* ${info.title}

✿ *Autor ›* @${info.author.username || 'Desconocido'}
♡ *Duración ›* ${info.duration || 'N/D'} seg

➭ *Estadísticas*
› ♡ Likes › ${info.likes?.toLocaleString() || 0}
› ꕥ Comentarios › ${info.comments?.toLocaleString() || 0}
› ✎ Compartidos › ${info.shares?.toLocaleString() || 0}
› ☁︎ Vistas › ${info.views?.toLocaleString() || 0}
`.trim()

    
    await conn.sendMessage(m.chat, {
      video: { url: info.video },
      caption,
      fileName: `${info.title}.mp4`,
      mimetype: 'video/mp4',
      contextInfo: {
        externalAdReply: {
          title: info.title,
          body: `Autor: ${info.author.name || 'Desconocido'}`,
          thumbnailUrl: info.thumbnail,
          sourceUrl: args[0],
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })

    
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    console.error('Error descargando TikTok:', err)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    m.reply('✿ *Error:* No pude descargar el video, intenta otra vez más tarde.')
  }
}

handler.command = ['tiktok', 'tt']
handler.help = ['tiktok']
handler.tags = ['descargas']

export default handler