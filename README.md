# RENOVA - Sistema de Gestión de WhatsApp

Sistema simple y enfocado para gestionar conversaciones de WhatsApp, seguimientos y renovaciones de clientes.

## 🚀 Estado del Proyecto

### ✅ Fase 1 Completada - Fundación (100%)

- ✅ Proyecto Next.js configurado con TypeScript
- ✅ Base de datos MongoDB con modelos definidos
- ✅ Sistema de autenticación con NextAuth.js
- ✅ Páginas de login y registro
- ✅ Dashboard básico
- ✅ Protección de rutas con middleware

### 📋 Próximas Fases

- **Fase 2:** Integración con WhatsApp Cloud API
- **Fase 3:** UI Core (Lista de conversaciones, Ficha del cliente)
- **Fase 4:** Sistema de recordatorios + IA
- **Fase 5:** Testing y Deploy

## 🛠️ Tecnologías

- **Frontend:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de datos:** MongoDB + Mongoose
- **Autenticación:** NextAuth.js
- **WhatsApp:** Meta WhatsApp Cloud API (próximamente)
- **IA:** OpenAI API (próximamente)

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd renova
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/renova

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-super-seguro

# WhatsApp Cloud API (configurar en Fase 2)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=tu-phone-id
WHATSAPP_ACCESS_TOKEN=tu-access-token
WHATSAPP_VERIFY_TOKEN=tu-verify-token

# OpenAI (configurar en Fase 4)
OPENAI_API_KEY=sk-tu-api-key
```

4. **Generar NEXTAUTH_SECRET**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. **Configurar MongoDB**

Opción A - MongoDB Atlas (Recomendado para desarrollo):
- Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Crear un cluster gratuito
- Obtener la cadena de conexión
- Reemplazar en `MONGODB_URI`

Opción B - MongoDB Local:
```bash
MONGODB_URI=mongodb://localhost:27017/renova
```

6. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

7. **Abrir en el navegador**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
renova/
├── src/
│   ├── app/                      # App Router de Next.js
│   │   ├── api/                  # API Routes
│   │   │   └── auth/            # Autenticación
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── login/               # Página de login
│   │   └── layout.tsx           # Layout raíz
│   │
│   ├── components/              # Componentes React
│   │   └── SessionProvider.tsx
│   │
│   ├── lib/                     # Utilidades
│   │   ├── mongodb.ts          # Conexión a MongoDB
│   │   └── auth.ts             # Configuración NextAuth
│   │
│   ├── models/                  # Modelos de Mongoose
│   │   ├── User.ts
│   │   ├── Client.ts
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   └── Reminder.ts
│   │
│   ├── types/                   # Tipos TypeScript
│   │   ├── index.ts
│   │   └── next-auth.d.ts
│   │
│   └── middleware.ts            # Protección de rutas
│
├── .env.local                   # Variables de entorno
└── package.json
```

## 🗄️ Modelos de Base de Datos

### User
- Email, password (hash), nombre
- WhatsApp Phone ID y Access Token

### Client
- Número de teléfono, nombre
- Estado: Nuevo | Interesado | Pagado | Renovación | Perdido
- Notas, última interacción, fecha de vencimiento

### Conversation
- Agrupa mensajes por cliente
- Última actividad, mensajes no leídos

### Message
- Contenido del mensaje
- Dirección (entrante/saliente)
- Estado (enviado/entregado/leído)

### Reminder
- Tipo: cobrar | seguimiento | renovar
- Fecha de vencimiento
- Estado de completado

## 🔐 Autenticación

El sistema usa NextAuth.js con:
- Proveedor de credenciales (email + password)
- Sesiones JWT
- Protección de rutas con middleware
- Hash de contraseñas con bcrypt

## 🚀 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint
```

## 📝 Próximos Pasos

1. **Configurar WhatsApp Cloud API**
   - Crear app en Meta Developer
   - Obtener Phone Number ID y Access Token
   - Configurar webhook

2. **Implementar recepción de mensajes**
   - Webhook handler
   - Guardar mensajes en DB
   - Crear clientes automáticamente

3. **Construir UI de conversaciones**
   - Lista de conversaciones
   - Ficha del cliente
   - Historial de mensajes

4. **Sistema de recordatorios**
   - CRUD de recordatorios
   - Vista de renovaciones

5. **Integración con IA**
   - Resumen de conversaciones
   - Sugerencias de acciones

## 🐛 Troubleshooting

### Error de conexión a MongoDB
- Verificar que `MONGODB_URI` esté correctamente configurado
- Verificar que tu IP esté en la whitelist de MongoDB Atlas
- Verificar credenciales de usuario

### Error de autenticación
- Verificar que `NEXTAUTH_SECRET` esté configurado
- Verificar que `NEXTAUTH_URL` coincida con tu URL

### Puerto 3000 en uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👨‍💻 Autor

Desarrollado para gestión de conversaciones de WhatsApp
