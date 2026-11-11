# Mis finanzas

App de finanzas personales en **un solo archivo** (`index.html`), publicada con GitHub Pages:
**https://juanjotabe2.github.io/FINANZAS-PERSONALES/**

Los datos **no están en este repositorio**. Viven en tu navegador y, si lo configuras, en una hoja privada de **tu** Google Drive personal.

## Archivos

| Archivo | Qué es | ¿En el repo? |
|---|---|---|
| `index.html` | La app | ✅ |
| `Code.gs` | Script para conectar la app con tu Google Sheets | ✅ (no contiene datos ni la clave) |
| `mis-finanzas.json` | **Tus datos** (copia de seguridad) | ❌ **Nunca**: el `.gitignore` bloquea cualquier `.json` |

## 1. Primer uso

1. Abre la app y pulsa **"Cargar mi copia de seguridad"** con `mis-finanzas.json`.
2. Los datos quedan guardados en ese navegador.

## 2. Sincronizar con tu Google Sheets (móvil + ordenador)

Hazlo con tu **cuenta personal de Google** (Gmail), no con la del trabajo. Son unos 5 minutos y solo hay que hacerlo una vez.

1. Crea una hoja nueva en <https://sheets.new> y llámala, por ejemplo, **"Mis finanzas – datos"**.
2. Abre **Extensiones → Apps Script**. Borra lo que haya, pega el contenido de [`Code.gs`](Code.gs) y guarda con 💾.
3. En la barra superior, elige la función **`configurar`** y pulsa **▶ Ejecutar**.
   - Google pedirá permisos y avisará de que "Google no ha verificado esta aplicación". Es normal, porque es tu propio script: pulsa **Configuración avanzada → Ir a … (no seguro) → Permitir**.
   - Se crean las pestañas (Movimientos, Patrimonio, Categorías, Reglas, Nóminas, Historial patrimonio) y se genera tu **clave secreta**. La verás en el **Registro de ejecución** y también en la hoja, en el menú **Mis finanzas → Ver clave secreta**.
4. Pulsa **Implementar → Nueva implementación**. En el engranaje, elige el tipo **Aplicación web** y configura:
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier usuario
   - Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
5. En la app, ve a **Ajustes → Sincronizar con mi Google Sheets**, pega la URL y la clave y pulsa **Conectar**. Tus datos se suben a la hoja.
6. En el móvil, abre la URL de la app ("Añadir a pantalla de inicio" para tenerla como app) y en **Ajustes** pega la misma URL y la misma clave.

### Cómo funciona y qué tan seguro es

- La hoja sigue siendo **privada**: solo tú puedes abrirla en Drive.
- La app habla con tu script por HTTPS. El script **solo responde si recibe la clave secreta** correcta; sin ella devuelve "Clave incorrecta".
- La clave **no está en el código ni en GitHub**: la escribes en cada dispositivo y se guarda solo en ese navegador.
- Trata la URL y la clave como una contraseña. Si crees que se han filtrado, en la hoja usa **Mis finanzas → Generar clave nueva** y vuelve a conectar tus dispositivos.
- Puedes **ver y editar los datos directamente en la hoja**: cambiar categorías, añadir o borrar filas. La app recoge los cambios al abrirse o al volver a la pestaña. Si añades una fila a mano, deja la columna `id` vacía: el script la rellena.
- Si editas en dos dispositivos sin conexión, al sincronizar se combinan los movimientos de ambos.

**Si algún día actualizas `Code.gs`:** en Apps Script, ve a **Implementar → Gestionar implementaciones → ✎ → Versión: Nueva versión → Implementar**. La URL no cambia.

## Qué puedes importar

- **Extractos bancarios** en CSV, Excel o PDF (Santander, Revolut u otros): detecta las columnas, marca los duplicados, enmascara los números de tarjeta y actualiza el saldo de la cuenta enlazada en Patrimonio.
- **Nóminas en PDF**: bruto, IRPF, Seguridad Social y líquido, sin duplicar el ingreso que ya está en el extracto.
- **eToro**: el *Account Statement* en Excel actualiza el valor y la base invertida.
- **A mano**: cualquier movimiento y los valores de tus activos.

Leer Excel y PDF descarga una librería gratuita (SheetJS / pdf.js) la primera vez. Los archivos se procesan en tu navegador y no se suben a ningún sitio.

## Cómo calcula (igual que tu hoja original)

- **Ahorro = ingresos − gastos de consumo.**
- **Gastos extraordinarios** (p. ej. el viaje familiar pagado con el ahorro del año): se muestran aparte.
- **Ahorro / inversión** (eToro, traspasos a Revolut): no es gasto; es el "dónde está el ahorro".
- **Traspaso interno**: movimientos entre tus cuentas que no cuentan.

Puedes cambiar categorías, presupuestos mensuales y reglas de categorización en **Ajustes**.
