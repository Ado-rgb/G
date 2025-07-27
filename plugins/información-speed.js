import os from 'os'
import process from 'process'

let handler = async (m, { conn }) => {
  let start = Date.now()
  await m.reply('⏳ Espera un toque...')

  let ping = Date.now() - start

  // Memoria
  let totalMem = os.totalmem() / 1024 / 1024
  let freeMem = os.freemem() / 1024 / 1024
  let usedMem = totalMem - freeMem
  let memPercent = (usedMem / totalMem) * 100

  // CPU
  let cpus = os.cpus()
  let cpuModel = cpus[0].model
  let cpuCores = cpus.length
  let cpuSpeed = cpus[0].speed // en MHz
  let loadAvg = os.loadavg()

  // Uptime
  let uptime = process.uptime()
  let systemUptime = os.uptime()

  function formatTime(s) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    return `${h ? h + 'h ' : ''}${m ? m + 'min ' : ''}${sec}s`
  }

  // Sistema operativo info
  let platform = os.platform()
  let release = os.release()
  let arch = os.arch()
  let hostname = os.hostname()

  // Detalles del proceso de Node
  let nodeVersion = process.version
  let pid = process.pid
  let cwd = process.cwd()

  let text = `
⚡ ꕥ *Estadísticas del Bot y Sistema* ꕥ ⚡

⏱️ Tiempo respuesta: *${ping} ms*
🧠 RAM usada: *${usedMem.toFixed(2)}* MB / *${totalMem.toFixed(2)}* MB (${memPercent.toFixed(2)}%)
🖥️ CPU: *${cpuModel}* - ${cpuCores} núcleos @ ${cpuSpeed} MHz
📊 Carga promedio (1, 5, 15 min): *${loadAvg.map(n => n.toFixed(2)).join(', ')}*
⏰ Uptime bot: *${formatTime(uptime)}*
🖥️ Uptime sistema: *${formatTime(systemUptime)}*

💻 Sistema:
- Plataforma: *${platform}*
- Release: *${release}*
- Arquitectura: *${arch}*
- Hostname: *${hostname}*

🧩 Node.js:
- Versión: *${nodeVersion}*
- PID: *${pid}*
- Directorio: *${cwd}*

ꕥ Sigo alive, sin miedo al éxito UwU
`

  await m.reply(text.trim())
}

handler.command = ['speed', 'ping', 'status']
handler.help = ['speed']
handler.tags = ['info']

export default handler