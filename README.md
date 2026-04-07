# YouJCA TECH - Linux & AI Hub

Una plataforma profesional dedicada a la tecnología, Linux e Inteligencia Artificial.

**🌐 Demo:** https://polo2020.github.io/youjca/

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (GitHub Pages)                   │
│  React + Vite + TypeScript + TailwindCSS                     │
│  - Interfaz de usuario                                       │
│  - Componentes React                                         │
│  - Routing básico                                            │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/Fetch
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Firebase)                        │
│  - Authentication: Google Sign-In                            │
│  - Firestore: Base de datos en tiempo real                   │
│  - Storage: Archivos y avatares                              │
│  - Security Rules: Control de acceso                         │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| **Frontend** | React 19 + Vite 6 | UI interactiva |
| **Estilos** | TailwindCSS 4 | Diseño responsive |
| **Animaciones** | Motion | Transiciones suaves |
| **Iconos** | Lucide React | Iconos modernos |
| **Auth** | Firebase Auth | Google Sign-In |
| **Database** | Firestore | Datos en tiempo real |
| **Storage** | Firebase Storage | Avatares y archivos |
| **Hosting** | GitHub Pages | Frontend estático |

---

## 📊 Estructura de Datos en Firebase

### Colecciones de Firestore

```
youtujca (Firebase Project)
├── users/{userId}
│   ├── displayName: string
│   ├── email: string
│   ├── avatar: string (URL)
│   ├── createdAt: timestamp
│   ├── role: "user" | "admin"
│   └── uid: string
│
├── allUsersList/{userId}
│   ├── displayName: string
│   ├── email: string
│   ├── avatar: string (URL)
│   ├── uid: string
│   └── role: "user" | "admin"
│
├── videos/{videoId}
│   ├── vimeoId: string
│   ├── title: string
│   ├── description: string
│   ├── thumbnail: string (URL)
│   ├── duration: string (mm:ss)
│   ├── category: "Linux" | "IA" | "Tutorial" | "Review" | "General"
│   ├── embedUrl: string
│   ├── views: number
│   ├── likes: number
│   └── importedAt: timestamp
│
├── comments/{commentId}
│   ├── videoId: string
│   ├── userId: string
│   ├── text: string
│   ├── userName: string
│   ├── userAvatar: string (URL)
│   ├── createdAt: timestamp
│   └── likes: number
│
├── favorites/{favoriteId}
│   ├── userId: string
│   ├── videoId: string
│   ├── videoTitle: string
│   └── addedAt: timestamp
│
├── history/{historyId}
│   ├── userId: string
│   ├── videoId: string
│   ├── videoTitle: string
│   └── watchedAt: timestamp
│
├── stats/{documentId}
│   ├── totalUsers: number
│   ├── totalVideos: number
│   ├── totalViews: number
│   └── lastSync: timestamp
│
├── settings/{documentId}
│   ├── avatarUrl: string (URL)
│   └── updatedAt: timestamp
│
└── admins/{userId}
    └── role: "admin"
```

---

## 🔐 Reglas de Seguridad (firestore.rules)

### Resumen de Permisos

| Colección | Lectura | Escritura |
|-----------|---------|-----------|
| `stats` | Solo Admin | Solo Admin |
| `settings` | Solo Admin | Solo Admin |
| `videos` | Público | Solo Admin |
| `allUsersList` | Admin o Dueño | Admin o Dueño |
| `comments` | Público | Auth (crea propio), Admin (todo) |
| `favorites` | Dueño o Admin | Dueño o Admin |
| `history` | Dueño o Admin | Dueño o Admin |
| `users` | Admin o Dueño | Admin o Dueño |

### Funciones de Seguridad

```javascript
// Verificar si es administrador (email específico)
request.auth.token.email == 'tu correo'

// Verificar autenticación
request.auth != null

// Verificar si es el dueño del recurso
request.auth.uid == resource.data.userId
```

---

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js 20+
- npm o yarn
- Cuenta en Firebase (para el backend)

La configuración de Firebase está en `firebase-applet-config.json`.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`

---

## 📦 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run build:gh` | Compilar con base path para GitHub Pages |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Verificar tipos TypeScript |
| `npm run deploy:gh` | Desplegar a GitHub Pages |

---

## 🔑 Configuración del Administrador

Para que un usuario sea administrador:

### Opción 1: Desde Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/project/youtujca/firestore)
2. Navega a `admins` → `Añadir documento`
3. ID del documento: UID del usuario
4. Campo `role`: `"admin"`

### Opción 2: Email de Super Admin

El email `aqui` tiene acceso automático como admin.

---

## 📱 Funcionalidades

### Para Todos los Usuarios

- ✅ Ver videos de Vimeo embebidos
- ✅ Buscar y filtrar videos por categoría
- ✅ Leer comentarios en videos
- ✅ Ver estadísticas en tiempo real
- ✅ Navegación responsive

### Para Usuarios Autenticados

- ✅ Comentar en videos
- ✅ Guardar videos en favoritos
- ✅ Historial de videos vistos
- ✅ Perfil de usuario con avatar

### Para Administradores

- ✅ Importar videos desde Vimeo
- ✅ Eliminar videos
- ✅ Ver lista de usuarios
- ✅ Sincronizar estadísticas manualmente
- ✅ Gestionar comentarios

---

## 🌐 Despliegue

### GitHub Pages (Frontend)

```bash
npm run deploy:gh
```

Esto:
1. Compila la app con `base: '/youjca/'`
2. Sube el `dist/` a la rama `gh-pages`
3. La app queda en: https://polo2020.github.io/youjca/

### Firebase (Backend)

El backend ya está configurado en Firebase:
- **Proyecto:** youtujca
- **Región:** us-central1
- **Firestore:** Modo producción

---

## 📈 Estadísticas en Tiempo Real

Las estadísticas se sincronizan automáticamente:

1. **Conteo automático:** Cada colección se cuenta en tiempo real con `onSnapshot`
2. **Persistencia:** Los totales se guardan en `/stats/counts`
3. **Actualización:** Se refresca con cada cambio en videos, usuarios o comentarios

### Métricas Disponibles

- 👥 Usuarios totales
- 🎬 Videos publicados
- 👁️ Vistas acumuladas
- 💬 Comentarios realizados

---

## 🛡️ Seguridad

### Firebase Security Rules

Las reglas están en `firestore.rules` y se aplican automáticamente:

```bash
firebase deploy --only firestore:rules
```

### Firebase Storage Rules

Las reglas para Storage están en `storage.rules`:

- Avatares: Solo imágenes < 2MB
- Admin puede subir, todos pueden leer
- Usuarios solo pueden subir su propio avatar

---

## 📝 Estructura del Proyecto

```
youjca/
├── src/
│   ├── App.tsx          # Componente principal
│   ├── firebase.ts      # Configuración de Firebase
│   ├── index.css        # Estilos globales
│   └── main.tsx         # Punto de entrada
├── public/              # Archivos estáticos
├── firebase-applet-config.json  # Config de Firebase
├── firestore.rules      # Reglas de seguridad
├── storage.rules        # Reglas de Storage
├── firebase.json        # Config de Firebase CLI
├── .firebaserc          # Proyecto Firebase
├── package.json         # Dependencias
├── tsconfig.json        # Config TypeScript
├── vite.config.ts       # Config Vite
└── README.md            # Este archivo
```

---

## 🔗 Enlaces

- **GitHub:** https://github.com/polo2020/youjca
- **Demo:** https://polo2020.github.io/youjca/
- **Firebase Console:** https://console.firebase.google.com/project/youtujca/overview

---

## 👨‍💻 Autor

**Jean Carlos Acevedo**

> "La tecnología es para todos, no solo para expertos" 💚

---

## 📄 Licencia

Apache-2.0 (ver archivo LICENSE)
