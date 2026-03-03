import { server } from './src/app/server'
import { PORT } from './src/config/env'
import { connectDB } from './src/config/db'
import { authService } from './src/modules/auth/auth.service'

async function bootstrap() {
  // Пытаемся подключиться к БД (опционально)
  await connectDB()

  // Создаем дефолтного администратора, если его еще нет
  try {
    await authService.ensureDefaultAdmin()
    console.log('👤 Default admin user ensured (admin@a.a)')
  } catch (err) {
    console.error('❌ Failed to ensure default admin user:', err)
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📡 Socket.io ready for connections`)
    console.log(`🎬 Video rooms API available at http://localhost:${PORT}/api/rooms`)
  })
}

bootstrap()
