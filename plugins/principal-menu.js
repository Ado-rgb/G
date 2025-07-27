let handler = async (m, { conn, usedPrefix }) => {
  try {
    // Aquí defines el número del bot principal (cambia al tuyo)
    const numeroPrincipal = '50493059810@s.whatsapp.net'
    const esBotPrincipal = conn.user?.id?.split(':')[0] === numeroPrincipal.split('@')[0]

    let tipoBot = esBotPrincipal ? 'Bot Principal' : 'Subbot'

    let menu = `*¡Hola! Soy ${globalThis.botname}*

> ꕥ *Menú de Comandos* ꕥ

> *Socket :* _*${tipoBot}*_
`

    let plugins = Object.values(global.plugins)
    let tagsAgrupados = {}

    for (let plugin of plugins) {
      if (!plugin.help || !plugin.tags) continue
      for (let tag of plugin.tags) {
        if (!tagsAgrupados[tag]) tagsAgrupados[tag] = []
        tagsAgrupados[tag].push(plugin)
      }
    }

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
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: '✧ Menú de comandos',
          body: '🔥 Bot desde cero..',
          mediaType: 1,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://files.catbox.moe/wp5z1y.jpg',
          sourceUrl: 'https://myapiadonix.vercel.app'
        }
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('Error al generar el menú')
 }
}

handler.command = ['menu', 'help', 'ayuda']

export default handler