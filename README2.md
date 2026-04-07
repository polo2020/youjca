# ⚡ YouJCA Tech - Plataforma de Videos

**Creador:** Jean Carlos Acevedo  
**Ubicación:** Venezuela 🇻🇪  
**GitHub:** [@polo2020](https://github.com/polo2020)

---

## 📋 Descripción

Plataforma web especializada en tecnología, Linux e Inteligencia Artificial.

- 🎬 **Videos de Vimeo** importados automáticamente
- 🔐 **Autenticación** con Google y Email
- 💾 **Firebase** para base de datos en la nube
- 🎨 **Diseño Cyberpunk** moderno y responsive

---



## 📁 Estructura del Proyecto

```
youjca/
├── index.html           # Aplicación principal
├── config.js            # Configuración de Firebase
├── firebase-config.js   # Módulo de Firebase
├── vimeo-importer.js    # Importador de videos (oEmbed)
├── deploy-github.sh     # Script de deploy
├── .gitignore           # Archivos ignorados por Git
└── README.md            # Este archivo
```

---

## 🔒 Seguridad


## 📁 Almacenamiento de Datos

| Dato | Ubicación | ¿Persiste? | ¿Todos lo ven? |
|------|-----------|------------|----------------|
| Videos | Firebase Firestore | ✅ Sí | ✅ Sí |
| Comentarios | Firebase Firestore | ✅ Sí | ✅ Sí |
| Likes | Firebase Firestore | ✅ Sí | ✅ Sí |
| Usuarios | Firebase Auth | ✅ Sí | ❌ No (privado) |
| Tu foto de perfil | Firebase Storage | ✅ Sí | ✅ Sí |
| Página web | GitHub Pages | ✅ Sí | ✅ Sí |


## 📞 Contacto

**Jean Carlos Acevedo**  
📍 Venezuela  
📧 Tu email (configúralo en Firebase)

> "La tecnología es para todos, no solo para expertos" 💚

---

**¡Disfruta tu plataforma YouJCA!** 🚀
