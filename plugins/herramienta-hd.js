let handler = async (m, { quoted }) => {
  console.log('QUOTED:', JSON.stringify(quoted, null, 2))
  m.reply('Chequea consola para ver el contenido de quoted')
}

handler.command = ['testquoted']
export default handler