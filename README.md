# Crypto Analytics Pro

Aplicación web instalable (PWA) para análisis técnico educativo de criptoactivos en mercado spot.

## Funciones
- Temporalidades de 5 min, 15 min, 1 h, 4 h, 1 día y 1 semana.
- Gráfico de velas OHLC, pivotes y precio spot.
- Indicadores RSI(14), MACD(12/26/9), ATR(14), VWAP aproximado, medias móviles y volumen relativo.
- Motor heurístico de sesgo técnico con zona orientativa, invalidación por ATR y objetivo de referencia.
- Mapa estimado de zonas de liquidez basado en ATR y pivotes.
- Flujo WebSocket de liquidaciones publicadas por Binance Futures cuando el activo tiene un símbolo compatible.
- Calculadora de tamaño de posición y riesgo.
- Lista de activos configurados con consulta a Binance Spot; ANSEM intenta usar MEXC.
- PWA adaptable a Android y caché básica.

## Publicar o actualizar desde Android
1. Descarga `crypto-analytics-pro-android.zip` y descomprímelo en el móvil.
2. Abre el repositorio de GitHub donde está publicada la app.
3. Pulsa **Add file → Upload files**.
4. Sube los archivos extraídos a la raíz del repositorio: `index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js`, `icon.svg` y `README.md`. Acepta reemplazar los archivos con el mismo nombre.
5. Pulsa **Commit changes**.
6. Espera a que GitHub Pages termine de publicar y abre la web en Chrome.
7. Si ves una versión antigua, cierra la PWA, abre la web en Chrome y recarga. El `sw.js` tiene una nueva versión de caché; puede hacer falta cerrar y abrir de nuevo la aplicación.
8. Para instalarla: menú ⋮ de Chrome → **Añadir a pantalla de inicio** o **Instalar aplicación**.

## Fuentes y limitaciones
- Binance Spot API: https://github.com/binance/binance-spot-api-docs
- Endpoint público de datos: https://data-api.binance.vision
- Alternative.me Fear & Greed: https://alternative.me/crypto/fear-and-greed-index/
- Binance Futures WebSocket: https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/ liquidation order stream.
- ANSEM intenta usar la API pública de MEXC. La disponibilidad de pares, intervalos y acceso desde el navegador puede cambiar.
- La lista de activos está configurada por símbolos y no todos los pares estarán necesariamente listados o accesibles. Si un par falla, prueba otro.
- El mapa no es un mapa institucional de liquidaciones: las zonas se estiman con volatilidad y pivotes; el flujo de eventos de futuros es parcial y no representa todas las posiciones del mercado.
- La puntuación de señales es una heurística, no un modelo validado ni una probabilidad de éxito. Las estimaciones no son asesoramiento financiero.
- No conecta cuentas, no usa claves privadas y no ejecuta órdenes.
