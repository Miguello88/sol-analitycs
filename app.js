const $=id=>document.getElementById(id);
let interval='4h',candles=[],pivots=[],currentPrice=null,selectedAsset='SOL',liqSocket=null,liqEvents=[];
const assets={
 BTC:{name:'Bitcoin',symbol:'BTCUSDT',source:'binance'},ETH:{name:'Ethereum',symbol:'ETHUSDT',source:'binance'},SOL:{name:'Solana',symbol:'SOLUSDT',source:'binance'},BNB:{name:'BNB',symbol:'BNBUSDT',source:'binance'},XRP:{name:'XRP',symbol:'XRPUSDT',source:'binance'},ADA:{name:'Cardano',symbol:'ADAUSDT',source:'binance'},DOGE:{name:'Dogecoin',symbol:'DOGEUSDT',source:'binance'},AVAX:{name:'Avalanche',symbol:'AVAXUSDT',source:'binance'},LINK:{name:'Chainlink',symbol:'LINKUSDT',source:'binance'},DOT:{name:'Polkadot',symbol:'DOTUSDT',source:'binance'},LTC:{name:'Litecoin',symbol:'LTCUSDT',source:'binance'},BCH:{name:'Bitcoin Cash',symbol:'BCHUSDT',source:'binance'},TRX:{name:'TRON',symbol:'TRXUSDT',source:'binance'},SUI:{name:'Sui',symbol:'SUIUSDT',source:'binance'},APT:{name:'Aptos',symbol:'APTUSDT',source:'binance'},NEAR:{name:'NEAR Protocol',symbol:'NEARUSDT',source:'binance'},ARB:{name:'Arbitrum',symbol:'ARBUSDT',source:'binance'},OP:{name:'Optimism',symbol:'OPUSDT',source:'binance'},INJ:{name:'Injective',symbol:'INJUSDT',source:'binance'},JUP:{name:'Jupiter',symbol:'JUPUSDT',source:'binance'},HYPE:{name:'Hyperliquid',symbol:'HYPEUSDT',source:'binance'},FET:{name:'Artificial Superintelligence Alliance',symbol:'FETUSDT',source:'binance'},RENDER:{name:'Render',symbol:'RENDERUSDT',source:'binance'},PEPE:{name:'Pepe',symbol:'PEPEUSDT',source:'binance'},ANSEM:{name:'The Black Bull',symbol:'ANSEMUSDT',source:'mexc'}
};
const money=n=>Number.isFinite(n)?n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:n<1?6:n<100?4:2}):'—';
const fmt=n=>Number.isFinite(n)?n.toLocaleString('es-ES',{maximumFractionDigits:4}):'—';
const shortDate=t=>new Date(t).toLocaleDateString('es-ES',{day:'2-digit',month:'short'});
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
async function getJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
function setupAssets(){ $('assetSelect').innerHTML=Object.entries(assets).map(([k,a])=>`<option value="${k}">${k} · ${a.name}</option>`).join('');$('assetSelect').value=selectedAsset; }
async function loadPrice(){
 const a=assets[selectedAsset];let ticker,raw,source;
 if(a.source==='binance'){
  const base='https://data-api.binance.vision/api/v3';
  [ticker,raw]=await Promise.all([getJson(`${base}/ticker/24hr?symbol=${a.symbol}`),getJson(`${base}/klines?symbol=${a.symbol}&interval=${interval}&limit=240`)]);source='Binance Spot';
  candles=raw.map(k=>({t:+k[0],o:+k[1],h:+k[2],l:+k[3],c:+k[4],v:+k[5]}));
 }else{
  const base='https://api.mexc.com/api/v3';[ticker,raw]=await Promise.all([getJson(`${base}/ticker/24hr?symbol=${a.symbol}`),getJson(`${base}/klines?symbol=${a.symbol}&interval=${({ '5m':'Min5','15m':'Min15','1h':'Min60','4h':'Hour4','1d':'Day1','1w':'Week1'})[interval]}&limit=240`)]);source='MEXC Spot';candles=raw.map(k=>({t:+k[0],o:+k[1],h:+k[2],l:+k[3],c:+k[4],v:+k[5]}));
 }
 if(!candles.length)throw new Error('El proveedor no devolvió velas para este par');currentPrice=Number(ticker.lastPrice);
 const ch=Number(ticker.priceChangePercent);$('change').textContent=`${ch>=0?'+':''}${ch.toFixed(2)}% · 24 h`;$('change').style.color=ch>=0?'var(--green)':'var(--red)';$('change').style.background=ch>=0?'#253a35':'#3b222c';
 $('pairLabel').textContent=`${selectedAsset} / USDT · MERCADO SPOT`;$('price').textContent=money(currentPrice);$('updated').textContent=`Actualizado: ${new Date().toLocaleString('es-ES')} · ${source}`;$('chartRange').textContent=`${candles.length} velas · ${interval}`;
 detectPivots();calcIndicators();drawChart();renderSignal();drawLiquidationMap();$('calcEntry').value=currentPrice.toPrecision(8).replace(/0+$/,'').replace(/\.$/,'');if(!$('calcStop').value&&candles.length)$('calcStop').value=(currentPrice-atr(14)).toPrecision(8);
}
async function loadFearGreed(){try{const d=await getJson('https://api.alternative.me/fng/?limit=8');const x=d.data?.[0];if(!x)throw Error('Sin datos');const v=+x.value;$('fngValue').innerHTML=`${v}<small>/100</small>`;$('fngBar').style.width=v+'%';$('fngDate').textContent=new Date(+x.timestamp*1000).toLocaleDateString('es-ES',{day:'2-digit',month:'short'});const avg=d.data.slice(0,7).reduce((s,z)=>s+(+z.value),0)/Math.min(7,d.data.length);$('fngLabel').textContent=`${x.value_classification} · media 7d ${avg.toFixed(0)}`}catch(e){$('fngLabel').textContent='Índice no disponible'}}
function sma(values,n){return values.length<n?null:values.slice(-n).reduce((a,b)=>a+b,0)/n}
function ema(values,n){if(values.length<n)return [];const k=2/(n+1);let out=[values.slice(0,n).reduce((a,b)=>a+b,0)/n];for(let i=n;i<values.length;i++)out.push(values[i]*k+out.at(-1)*(1-k));return out}
function rsi(n=14){if(candles.length<n+1)return null;let gains=0,losses=0;for(let i=candles.length-n;i<candles.length;i++){const d=candles[i].c-candles[i-1].c;if(d>0)gains+=d;else losses-=d}if(losses===0)return 100;return 100-100/(1+(gains/n)/(losses/n))}
function atr(n=14){if(candles.length<n+1)return null;const trs=[];for(let i=candles.length-n;i<candles.length;i++){const c=candles[i],p=candles[i-1];trs.push(Math.max(c.h-c.l,Math.abs(c.h-p.c),Math.abs(c.l-p.c)))}return trs.reduce((a,b)=>a+b,0)/n}
function macd(){const cls=candles.map(c=>c.c),e12=ema(cls,12),e26=ema(cls,26);if(!e12.length||!e26.length)return null;const offset=26-12;const line=e26.map((v,i)=>e12[i+offset]-v);const sig=ema(line,9);if(!sig.length)return null;return {line:line.at(-1),signal:sig.at(-1),hist:line.at(-1)-sig.at(-1)}}
function vwap(){let pv=0,vol=0;for(const c of candles){const typ=(c.h+c.l+c.c)/3;pv+=typ*c.v;vol+=c.v}return vol?pv/vol:null}
function detectPivots(){const p=[],w=3;for(let i=w;i<candles.length-w;i++){let hi=true,lo=true;for(let j=i-w;j<=i+w;j++){if(j===i)continue;if(candles[j].h>=candles[i].h)hi=false;if(candles[j].l<=candles[i].l)lo=false}if(hi)p.push({i,price:candles[i].h,type:'H'});if(lo)p.push({i,price:candles[i].l,type:'L'})}p.sort((a,b)=>a.i-b.i);pivots=[];for(const pvt of p){const last=pivots.at(-1);if(last&&last.type===pvt.type){if((pvt.type==='H'&&pvt.price>last.price)||(pvt.type==='L'&&pvt.price<last.price))pivots[pivots.length-1]=pvt}else pivots.push(pvt)}pivots=pivots.slice(-12)}
function calcIndicators(){const cls=candles.map(c=>c.c),ma20=sma(cls,20),ma50=sma(cls,50),rv=rsi(),av=atr(),m=macd(),vw=vwap(),volAvg=sma(candles.map(c=>c.v),20),rel=volAvg?candles.at(-1).v/volAvg:null;
 $('ma20').textContent=money(ma20);$('ma50').textContent=money(ma50);let trend='Tendencia mixta',note='Medias y precio sin alineación clara';if(ma20&&ma50&&currentPrice>ma20&&ma20>ma50){trend='Alcista';note='Precio sobre MA20 y MA20 sobre MA50'}else if(ma20&&ma50&&currentPrice<ma20&&ma20<ma50){trend='Bajista';note='Precio bajo MA20 y MA20 bajo MA50'}else if(ma20&&currentPrice>ma20){trend='Recuperación';note='Precio sobre MA20; falta confirmación de tendencia larga'}else if(ma20){trend='Debilidad';note='Precio bajo MA20'}$('trend').textContent=trend;$('trendNote').textContent=note;
 $('rsi').textContent=rv===null?'—':rv.toFixed(1);$('rsiNote').textContent=rv===null?'Datos insuficientes':rv>=70?'Sobrecompra orientativa':rv<=30?'Sobreventa orientativa':'Zona intermedia';$('macd').textContent=m?fmt(m.line):'—';$('macdNote').textContent=m?`Señal ${fmt(m.signal)} · hist. ${fmt(m.hist)}`:'Datos insuficientes';$('atr').textContent=av?money(av):'—';$('atrPct').textContent=av?`${(av/currentPrice*100).toFixed(2)}% del precio`:'Datos insuficientes';$('relVol').textContent=rel?`${rel.toFixed(2)}×`:'—';$('vwap').textContent=money(vw)}
function drawChart(){const cv=$('priceChart'),ctx=cv.getContext('2d'),ratio=window.devicePixelRatio||1,w=cv.clientWidth||600,h=300;cv.width=w*ratio;cv.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);if(candles.length<2)return;const pad={l:8,r:65,t:12,b:25},lo=Math.min(...candles.map(c=>c.l)),hi=Math.max(...candles.map(c=>c.h)),range=hi-lo||1,min=lo-range*.06,max=hi+range*.06,x=i=>pad.l+i/(candles.length-1)*(w-pad.l-pad.r),y=v=>pad.t+(max-v)/(max-min)*(h-pad.t-pad.b);ctx.font='10px system-ui';ctx.strokeStyle='#292d40';ctx.fillStyle='#9298af';for(let j=0;j<5;j++){const yy=pad.t+j*(h-pad.t-pad.b)/4;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();ctx.fillText(money(max-j*(max-min)/4),w-pad.r+4,yy+3)}const cw=Math.max(2,Math.min(8,(w-pad.l-pad.r)/candles.length*.65));candles.forEach((c,i)=>{const xx=x(i),up=c.c>=c.o;ctx.strokeStyle=up?'#4adea5':'#fb7185';ctx.fillStyle=up?'#4adea5':'#fb7185';ctx.beginPath();ctx.moveTo(xx,y(c.h));ctx.lineTo(xx,y(c.l));ctx.stroke();const top=y(Math.max(c.o,c.c)),bh=Math.max(1,Math.abs(y(c.o)-y(c.c)));ctx.fillRect(xx-cw/2,top,cw,bh)});pivots.forEach(p=>{ctx.beginPath();ctx.arc(x(p.i),y(p.price),3,0,Math.PI*2);ctx.fillStyle=p.type==='H'?'#fb7185':'#4adea5';ctx.fill()});ctx.fillStyle='#9298af';ctx.fillText(shortDate(candles[0].t),pad.l,h-5);ctx.fillText(shortDate(candles.at(-1).t),Math.max(pad.l,w-pad.r-35),h-5)}

function renderSignal(){
  const rv=rsi(),
        m=macd(),
        av=atr(),
        ma20=sma(candles.map(c=>c.c),20),
        ma50=sma(candles.map(c=>c.c),50);

  if(
    rv===null || !m ||
    !Number.isFinite(av) || av<=0 ||
    !Number.isFinite(ma20) ||
    !Number.isFinite(ma50) ||
    !Number.isFinite(currentPrice) ||
    currentPrice<=0
  ) return;

  let score=0;
  const reasons=[];

  // Tendencia
  if(currentPrice>ma20 && ma20>ma50){
    score+=2;
    reasons.push('Tendencia alcista');
  }else if(currentPrice<ma20 && ma20<ma50){
    score-=2;
    reasons.push('Tendencia bajista');
  }else{
    reasons.push('Tendencia lateral o mixta');
  }

  // MACD
  if(m.hist>0){
    score++;
    reasons.push('MACD positivo');
  }else if(m.hist<0){
    score--;
    reasons.push('MACD negativo');
  }

  // RSI
  if(rv>=52 && rv<68){
    score++;
    reasons.push('RSI favorable');
  }else if(rv<45 && rv>30){
    score--;
    reasons.push('RSI débil');
  }else if(rv>=68){
    reasons.push('RSI elevado: evitar perseguir precio');
  }else if(rv<=30){
    reasons.push('RSI sobrevendido: esperar confirmación');
  }

  // Señal final
  let title='Esperar confirmación';
  let desc='No hay suficientes condiciones para entrar.';
  let badge='NEUTRAL';
  let buy=score>=3 && rv<68 && currentPrice>ma20;

  if(buy){
    title='Posible entrada de compra';
    desc='Confluencia alcista: '+reasons.join(', ')+
      '. Esperar confirmación antes de entrar.';
    badge='COMPRA';
  }else if(score<=-3){
    title='Tendencia bajista';
    desc='Presión vendedora: '+reasons.join(', ')+
      '. Evitar nuevas compras mientras no cambie la tendencia.';
    badge='BAJISTA';
  }else{
    desc='Señales mixtas: '+reasons.join(', ')+
      '. Esperar una oportunidad más clara.';
  }

  // Gestión de riesgo: solo para posibles compras
  const stop=currentPrice-av*1.5;
  const target=currentPrice+av*3;

  $('signalBadge').textContent=badge;
  $('signalTitle').textContent=title;
  $('signalText').textContent=desc;

  $('signalBox').className='signal '+
    (buy?'good':score<=-3?'bad':'neutral');

  $('entryZone').textContent=buy
    ?`${money(currentPrice-av*.5)} – ${money(currentPrice)}`
    :'Esperar confirmación';

  $('invalidation').textContent=buy?money(stop):'—';
  $('target').textContent=buy?money(target):'—';
}
function drawLiquidationMap(){const av=atr(14)||currentPrice*.02;const supports=pivots.filter(p=>p.type==='L'&&p.price<currentPrice).slice(-4).map(p=>p.price);const resistances=pivots.filter(p=>p.type==='H'&&p.price>currentPrice).slice(-4).map(p=>p.price);const down=supports.length?supports: [currentPrice-av,currentPrice-av*1.7,currentPrice-av*2.5];const up=resistances.length?resistances:[currentPrice+av,currentPrice+av*1.7,currentPrice+av*2.5];$('liqDown').textContent=money(Math.max(...down));$('liqCurrent').textContent=money(currentPrice);$('liqUp').textContent=money(Math.min(...up));$('liqStatus').textContent='Zonas estimadas';const cv=$('liqChart'),ctx=cv.getContext('2d'),ratio=window.devicePixelRatio||1,w=cv.clientWidth||600,h=220;cv.width=w*ratio;cv.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);const vals=[...down,currentPrice,...up],min=Math.min(...vals)-av*.5,max=Math.max(...vals)+av*.5,y=v=>h-22-(v-min)/(max-min||1)*(h-44);ctx.font='11px system-ui';ctx.fillStyle='#9298af';ctx.fillText('Zonas potenciales — estimación técnica, no datos de posiciones',8,14);down.forEach((v,i)=>{ctx.fillStyle='#fb718566';ctx.fillRect(8,y(v)-7,w-16,14);ctx.fillStyle='#fda4af';ctx.fillText('Liquidez inferior · '+money(v),12,y(v)-9)});up.forEach(v=>{ctx.fillStyle='#4adea566';ctx.fillRect(8,y(v)-7,w-16,14);ctx.fillStyle='#86efac';ctx.fillText('Liquidez superior · '+money(v),12,y(v)-9)});ctx.strokeStyle='#a78bfa';ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(8,y(currentPrice));ctx.lineTo(w-8,y(currentPrice));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#d8b4fe';ctx.fillText('Precio spot '+money(currentPrice),12,y(currentPrice)-9)}
function connectLiquidations(){if(liqSocket){try{liqSocket.close()}catch(e){}}liqEvents=[];$('liqFeed').innerHTML='<li>Esperando eventos del mercado de futuros…</li>';const symbol=assets[selectedAsset].symbol.toLowerCase();if(assets[selectedAsset].source!=='binance'){$('liqStatus').textContent='Flujo no disponible';$('liqFeedNote').textContent='El proveedor de este activo no está conectado al flujo de liquidaciones de Binance Futures.';return}try{liqSocket=new WebSocket(`wss://fstream.binance.com/ws/${symbol}@forceOrder`);liqSocket.onopen=()=>{$('liqFeedNote').textContent=`Conectado al flujo público de Binance Futures para ${selectedAsset}.`;};liqSocket.onmessage=e=>{try{const d=JSON.parse(e.data).o;const item={side:d.S==='SELL'?'Long liquidado':'Short liquidado',price:+d.ap||+d.p,qty:+d.q,time:Date.now()};liqEvents.unshift(item);liqEvents=liqEvents.slice(0,8);$('liqFeed').innerHTML=liqEvents.map(x=>`<li><strong>${x.side}</strong> · ${money(x.price)} · cantidad ${fmt(x.qty)} <small>${new Date(x.time).toLocaleTimeString('es-ES')}</small></li>`).join('');$('liqStatus').textContent='Flujo conectado'}catch(err){}};liqSocket.onerror=()=>{$('liqFeedNote').textContent='El WebSocket no está disponible ahora. El mapa estimado sigue funcionando.';$('liqStatus').textContent='Flujo no disponible'};liqSocket.onclose=()=>{if(!$('liqFeed').children.length)$('liqFeed').innerHTML='<li>Sin eventos recibidos.</li>'}}catch(e){$('liqFeedNote').textContent='No se pudo abrir el flujo en este navegador.'}}
function calculatePosition(){const capital=+$('capital').value,risk=+$('risk').value/100,entry=+$('calcEntry').value,stop=+$('calcStop').value;if(!(capital>0&&risk>0&&entry>0&&stop>0&&stop<entry)){$('calcResult').textContent='Comprueba los valores: en spot, el stop debe ser positivo y estar por debajo de la entrada.';return}const riskUsd=capital*risk,qty=riskUsd/(entry-stop),cost=qty*entry;$('calcResult').innerHTML=`Riesgo teórico: <strong>${money(riskUsd)}</strong> · Cantidad: <strong>${qty.toFixed(6)} ${selectedAsset}</strong> · Capital necesario: <strong>${money(cost)}</strong>. ${cost>capital?'Aviso: la posición supera el capital disponible. ':''}No incluye comisiones ni deslizamiento.`}
$('assetSelect').addEventListener('change',async e=>{selectedAsset=e.target.value;try{await loadPrice();connectLiquidations();toast(`${selectedAsset} cargado`)}catch(err){$('price').textContent='Sin datos';$('updated').textContent=`No se pudo cargar ${selectedAsset}: ${err.message}. Prueba otro activo.`;toast('Par no disponible o API temporalmente inaccesible')}});
$('intervalSelect').addEventListener('change',async e=>{interval=e.target.value;try{await loadPrice()}catch(err){toast('No se pudo cargar esta temporalidad: '+err.message)}});
$('refreshBtn').addEventListener('click',async()=>{try{await loadPrice();await loadFearGreed();toast('Datos actualizados')}catch(e){toast('Error al actualizar: '+e.message)}});$('calcBtn').addEventListener('click',calculatePosition);window.addEventListener('resize',()=>{drawChart();drawLiquidationMap()});
async function start(){setupAssets();try{await loadPrice()}catch(e){$('price').textContent='Sin conexión';$('updated').textContent='No se pudo conectar con el mercado. Pulsa Actualizar o prueba otro activo.';toast('Error de conexión')}await loadFearGreed();connectLiquidations()}start();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
