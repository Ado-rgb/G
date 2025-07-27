let handler = async (m, { conn, usedPrefix }) => {
  try {
    let menu = `*¡Hola! Soy ${globalThis.botname}*

> ꕥ *Menú de Comandos* ꕥ
`

    // Agrupar comandos por tag automáticamente
    let plugins = Object.values(global.plugins)
    let tagsAgrupados = {}

    for (let plugin of plugins) {
      if (!plugin.help || !plugin.tags) continue
      for (let tag of plugin.tags) {
        if (!tagsAgrupados[tag]) tagsAgrupados[tag] = []
        tagsAgrupados[tag].push(plugin)
      }
    }

    // Construir menú
    for (let tag in tagsAgrupados) {
      menu += `\n╭─❒ *${tag.toUpperCase()}*\n`
      for (let plugin of tagsAgrupados[tag]) {
        menu += `│ • ${usedPrefix}${plugin.help[0]}\n`
      }
      menu += `╰──────────────\n`
    }

    menu += `\n♡ Estado › *Activo*\n`

    await conn.sendMessage(m.chat, {
      text: menu,
      contextInfo: {
        externalAdReply: {
          title: 'Menú de comandos',
          body: 'Selecciona un comando',
          mediaType: 1,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://files.catbox.moe/wp5z1y.jpg',
          sourceUrl: 'https://youtube.com'
        }
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('Error al generar el menú')
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'ayuda']

export default handler