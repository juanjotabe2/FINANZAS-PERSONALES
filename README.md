# Mis finanzas

App de finanzas personales en **un solo archivo** (`index.html`). Funciona abriéndola con doble clic o publicada en GitHub Pages. No necesita servidor.

## Archivos

| Archivo | Qué es | ¿Subir a GitHub? |
|---|---|---|
| `index.html` | La app | ✅ Sí |
| `supabase.sql` | Tabla para sincronizar (opcional) | ✅ Sí (no tiene datos) |
| `mis-finanzas.json` | **Tus datos** (sep–nov 2026 + patrimonio a 11/11/2026) | ❌ **Nunca** en un repositorio público |

## 1. Usarla en tu ordenador (2 minutos)

1. Abre `index.html` en Chrome, Edge, Firefox o Safari.
2. Pulsa **"Cargar mi copia de seguridad"** y elige `mis-finanzas.json`.
3. Listo. Los datos quedan guardados en ese navegador.

## 2. Publicarla online con GitHub Pages

1. En GitHub, crea un repositorio nuevo (p. ej. `finanzas`). Puede ser público, porque la app no lleva datos.
2. Sube **solo** `index.html` (y si quieres `README.md` y `supabase.sql`).
3. En el repositorio: **Settings → Pages → Source: Deploy from a branch → `main` / root → Save**.
4. En 1–2 minutos estará en `https://TU-USUARIO.github.io/finanzas/`. Ábrela en el móvil y usa "Añadir a pantalla de inicio" para tenerla como una app.

> Sin el paso 3, cada navegador o dispositivo guarda sus propios datos. Para tener lo mismo en el móvil y en el ordenador, configura la sincronización.

## 3. Sincronizar entre dispositivos con Supabase (opcional, gratis)

Usa una cuenta **personal** de Supabase, no la del trabajo.

1. Entra en <https://supabase.com>, crea una cuenta y un proyecto nuevo (región Europa, plan Free).
2. **SQL Editor → New query**, pega el contenido de `supabase.sql` y pulsa **Run**.
3. **Project Settings → API**: copia la **Project URL** y la **publishable key** (o la `anon` key).
4. En la app: **Ajustes → Sincronización**. Pega la URL y la clave, pulsa **Conectar** y luego **Crear cuenta** con tu email y contraseña.
   - Si Supabase pide confirmar el email, abre el correo, confírmalo y pulsa **Entrar**.
5. **Importante:** cuando ya tengas tu cuenta, ve a **Authentication → Sign In / Providers** en Supabase y **desactiva "Allow new users to sign up"**. Así nadie más puede crear cuentas en tu proyecto.
6. En el primer dispositivo (el que ya tiene tus datos), pulsa **Sincronizar ahora**: tus datos se suben.
7. En el móvil: abre la URL de GitHub Pages → Ajustes → pega la misma URL y clave → **Entrar**. Se descargan tus datos.

**Atajo opcional:** pon la URL y la clave en las constantes `SUPABASE_URL` y `SUPABASE_KEY` al principio del `<script>` de `index.html`. Así en cada dispositivo solo tendrás que iniciar sesión. La clave publishable/anon está pensada para ser pública: la seguridad la dan las políticas RLS del SQL (cada usuario solo ve su fila).

**Cómo funciona:** cada cambio se guarda al momento en el navegador y se sube a los ~2 s. Al volver a la pestaña se descarga lo nuevo. Si editas en dos dispositivos sin conexión, al sincronizar se combinan los movimientos de ambos (los borrados también se respetan).

## Qué puedes importar

- **Extractos bancarios** en CSV, Excel o PDF (Santander, Revolut u otros bancos). La app detecta las columnas, marca los duplicados, enmascara los números de tarjeta y, si una cuenta de Patrimonio está enlazada, actualiza su saldo.
- **Nóminas en PDF:** bruto, IRPF, Seguridad Social y líquido. No duplica el ingreso si ya llegó por el extracto.
- **eToro:** el *Account Statement* en Excel actualiza el valor y la base invertida. También se puede hacer a mano.
- **A mano:** cualquier movimiento (efectivo, etc.) y los valores de tus activos.

Leer Excel y PDF descarga una librería gratuita (SheetJS / pdf.js) la primera vez. Los archivos se procesan en tu navegador y no se suben a ningún sitio.

## Cómo calcula (igual que tu hoja)

- **Ahorro = ingresos − gastos de consumo.**
- **Gastos extraordinarios** (p. ej. el viaje familiar pagado con el ahorro del año): se muestran aparte → "ahorro tras extraordinarios".
- **Ahorro / inversión** (eToro, traspasos a Revolut): no es gasto; es el "dónde está el ahorro".
- **Traspaso interno**: movimientos entre tus cuentas que no deben contar (p. ej. la recarga vista desde Revolut).

Puedes cambiar el tipo de cualquier categoría, añadir categorías, presupuestos mensuales y reglas en **Ajustes**.

## Copias de seguridad

**Ajustes → Exportar copia** descarga un `.json` con todo. Hazlo de vez en cuando, sobre todo si no usas la sincronización: borrar los datos del navegador borra la app.
