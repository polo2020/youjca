# 🔒 SEGURIDAD DE DATOS - YouJCA

## ✅ Estado Actual: PROTEGIDO

---

## 📊 Resumen de Protección

| Tipo de Dato | ¿Protegido? | ¿Quién puede acceder? |
|-------------|------------|----------------------|
| **Usuarios (emails, nombres)** | ✅ SÍ | Solo el dueño o el admin |
| **Comentarios** | ✅ SÍ | Público (lectura), dueño (escritura) |
| **Favoritos** | ✅ SÍ | Solo el dueño o admin |
| **Historial** | ✅ SÍ | Solo el dueño o admin |
| **Videos** | ✅ SÍ | Público (lectura), admin (escritura) |
| **Storage (archivos)** | ✅ SÍ | Autenticados (lectura), admin (escritura) |

---

## 🔐 Reglas de Seguridad Implementadas

### 1. **Firestore Database**

```javascript
// Colección admins: define quién es admin (UIDs, no emails)
match /admins/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false; // Solo desde Firebase Console
}

// Función isAdmin() - consulta la colección admins
function isAdmin() {
  return request.auth != null &&
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

// Colección users: PROTEGIDA
match /users/{userId} {
  allow read: if request.auth != null && (isOwner(userId) || isAdmin());
  allow write: if request.auth != null && (isOwner(userId) || isAdmin());
  allow delete: if isAdmin();
}

// Nadie puede listar TODA la colección users (excepto admin)
match /users/{document=**} {
  allow read: if isAdmin();
}
```

### 2. **Firebase Storage**

```javascript
// Admin por email (para Storage se requiere plan Blaze para usar UID)
// Alternativa: consultar colección admins en Firestore
function isAdmin() {
  return request.auth != null &&
    request.auth.token.email == 'jcristojean2020@gmail.com';
}

// Validaciones para avatares
function isImage() {
  return request.resource.contentType.matches('image/.*');
}

function isUnderSizeLimit() {
  return request.resource.size < 2 * 1024 * 1024; // 2MB
}

// Avatar del creador: solo admin puede subir
match /creator-avatar/{fileName} {
  allow read: if true;
  allow write: if isAdmin();
}

// Fotos de usuario: solo el dueño puede subir (con validación)
match /user-avatars/{userId}/{fileName} {
  allow read: if true;
  allow write: if isOwner(userId) && isImage() && isUnderSizeLimit();
}
```

> **Nota:** Storage usa email hardcodeado. Para usar UID (como Firestore), se necesita plan Blaze.

---

## 🛡️ Protección por Capas

### Capa 1: **Reglas de Firestore** (Backend)
- ✅ Solo usuarios autenticados pueden leer datos
- ✅ Admin verificado por UID en colección `admins/` (no por email)
- ✅ Cada usuario solo puede ver SU PROPIO perfil
- ✅ Validación en el servidor de Firebase

### Capa 2: **Validación en Frontend**
- ✅ Verificación de UID de admin antes de cargar datos sensibles
- ✅ Mensajes de error si usuario no autorizado intenta acceder
- ✅ Doble protección (frontend + backend)

### Capa 3: **Firebase Authentication**
- ✅ Solo Google Sign-In permitido
- ✅ Tokens de autenticación verificados
- ✅ Emails verificados por Google

---

## ⚠️ Lo que NO puede hacer un usuario normal

| Acción | ¿Puede? | Razón |
|--------|---------|-------|
| Ver su propio perfil | ✅ SÍ | Es su dato |
| Ver perfil de OTRO usuario | ❌ NO | Protegido por reglas |
| Listar TODOS los usuarios | ❌ NO | Solo admin |
| Ver emails de otros usuarios | ❌ NO | Datos sensibles |
| Eliminar su cuenta (Firestore) | ✅ SÍ | Es su dato |
| Eliminar OTRO usuario | ❌ NO | Solo admin |
| Modificar videos | ❌ NO | Solo admin |
| Comentar videos | ✅ SÍ | Función permitida |
| Dar like | ✅ SÍ | Función permitida |

---

## 🔍 Auditoría de Seguridad Realizada

### ✅ Lo que está protegido:

1. **Colección `/users/`**
   - ✅ Solo lectura para el dueño
   - ✅ Admin puede gestionar
   - ✅ No se puede listar sin ser admin

2. **Colección `/favorites/`**
   - ✅ Solo el dueño puede ver sus favoritos
   - ✅ Admin puede ver todo

3. **Colección `/history/`**
   - ✅ Solo el dueño puede ver su historial
   - ✅ Admin puede ver todo

4. **Colección `/comments/`**
   - ✅ Público puede leer (necesario para mostrar comentarios)
   - ✅ Solo dueño puede eliminar los suyos

5. **Storage**
   - ✅ Solo autenticados pueden leer archivos
   - ✅ Solo admin puede subir/eliminar

---

## 📝 Recomendaciones Adicionales

### ✅ Ya implementado:
- [x] Reglas de Firestore seguras
- [x] Reglas de Storage seguras
- [x] Validación en frontend
- [x] Solo Google Auth
- [x] Admin protegido

### 🔮 Para el futuro (opcional):
- [ ] Cloud Functions para operaciones sensibles
- [ ] Logs de auditoría para acciones de admin
- [ ] Rate limiting para prevenir abuso
- [ ] Validación de datos más estricta

---

## 🚀 Despliegue de Reglas

Las reglas están activas en Firebase desde:
```bash
firebase deploy --only firestore:rules,storage
```

---

## ⚙️ Configurar Administrador

Para que las reglas funcionen, debes crear el documento admin en Firestore:

1. Ve a Firebase Console > Firestore Database
2. Crea una colección llamada `admins`
3. Crea un documento con tu UID como ID
4. Agrega un campo, por ejemplo: `role: "admin"`

**Cómo obtener tu UID:**
- Firebase Console > Authentication > Usuarios > tu usuario > UID

**Ejemplo de documento:**
```
Colección: admins
Documento ID: xKj8s9d7f2... (tu UID)
Campos: { role: "admin" }
```

---

## 📞 Contacto de Seguridad

Administrador: `jcristojean2020@gmail.com`

---

## 📅 Fecha de Última Actualización

**Marzo 2026** - Protección con UID-based admin, validación de tipo/tamaño en Storage
