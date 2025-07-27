import yts from 'yt-search'

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!args.length) return m.reply(`✿ *Uso:* ${usedPrefix}yts <término de búsqueda>`)

  let searchTerm = args.join(' ')
  let results = await yts(searchTerm)
  let videos = results.videos.slice(0, 20) // Top 20

  if (videos.length === 0) return m.reply(`❌ No encontré nada para *${searchTerm}*`)

  let page = 1
  let perPage = 10
  let totalPages = Math.ceil(videos.length / perPage)
  let start = (page - 1) * perPage
  let end = start + perPage

  let listPage = videos.slice(start, end)

  let text = `*✩ YouTube Search (✿❛◡❛)*\n*❒ Resultados para:* ${searchTerm}\n*❒ Resultados encontrados:* ${videos.length}\n\n`

  listPage.forEach((video, i) => {
    text += `› *${video.title}* (${video.timestamp})\n`
    text += `  🔰 Canal: ${video.author.name}\n`
    text += `  🔗 Link: ${video.url}\n\n`
  })

  text += `> ⌦ Página *${page}* de *${totalPages}*`

  m.reply(text.trim())
}

handler.command = ['yts', 'ytsearch']
handler.help = ['yts']
handler.tags = ['buscadores']

export default handler