# Solana Analytics (MVP)

Aplicación web instalable (PWA) para analizar SOL, JUP, HYPE, ANSEM, LINK, AVAX, ETH y BTC en mercado spot y swing trading.

## Incluye
- Precio spot y cambio de 24 horas.
- Velas diarias/semanales de la API pública de Binance.
- Índice Crypto Fear & Greed de Alternative.me, con atribución.
- Medias móviles de 20 y 50 velas.
- Gráfico sencillo y detección heurística de pivotes.
- Zona Fibonacci orientativa, nivel de invalidación y objetivo de referencia.
- Calculadora de tamaño de posición por riesgo.
- Diseño adaptable a Android y caché básica de la interfaz.

## Limitaciones importantes
- El recuento de Elliott es experimental y NO constituye una identificación validada de ondas 1–5/A–B–C. La detección automática de pivotes no sustituye el análisis de un operador.
- El Fear & Greed de Alternative.me representa el sentimiento general del mercado cripto, no exclusivamente Solana.
- No hay órdenes automáticas, conexión a cuentas ni claves privadas.
- No es asesoramiento financiero. Los niveles pueden fallar y no incluyen comisiones ni deslizamiento.
- Los servicios externos pueden limitar peticiones, cambiar políticas CORS o no estar disponibles temporalmente.

## Publicar gratis con GitHub Pages desde Android
1. Descarga y descomprime el ZIP en tu móvil.
2. En GitHub crea un repositorio público llamado `solana-analytics`.
3. Dentro del repositorio pulsa **Add file → Upload files** y sube todos los archivos y el contenido de la carpeta del proyecto (no solo el ZIP).
4. Pulsa **Commit changes**.
5. En el repositorio entra en **Settings → Pages**.
6. En **Build and deployment**, elige **Deploy from a branch**, rama `main`, carpeta `/(root)` y guarda.
7. Espera a que GitHub publique el sitio. La URL suele tener la forma `https://TU-USUARIO.github.io/solana-analytics/`.
8. Abre esa URL en Chrome para Android. Menú ⋮ → **Añadir a pantalla de inicio** o **Instalar aplicación**.

Si GitHub muestra una opción distinta en el móvil, envía una captura y te guío con la pantalla exacta.

## Fuentes
- Binance Spot API: https://github.com/binance/binance-spot-api-docs
- Binance market-data-only endpoint: https://data-api.binance.vision
- Alternative.me Fear & Greed: https://alternative.me/crypto/fear-and-greed-index/


## Activos y fuentes
- SOL, JUP, HYPE, LINK, AVAX y BTC/ETH: datos públicos de Binance Spot.
- ANSEM (The Black Bull): se intenta consultar el par público ANSEM/USDT de MEXC. Si el proveedor o el navegador bloquean la consulta, ese activo puede no cargar; los demás activos siguen usando Binance.
- Fear & Greed procede de Alternative.me y representa el sentimiento general del mercado, no el sentimiento exclusivo de cada moneda.
- Las ondas son una heurística experimental de pivotes y Fibonacci, no un recuento Elliott validado ni una recomendación de compra o venta.
