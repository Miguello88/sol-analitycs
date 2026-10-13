const $ = id => document.getElementById(id);
let interval = "1d", candles = [], pivots = [], currentPrice = null;
const money = n => Number.isFinite(n) ? n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:n<1?5:2}) : "—";
const shortDate = t => new Date(t).toLocaleDateString("es-ES",{day:"2-digit",month:"short"});
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800)}
async function getJson(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
async function loadPrice(){
  const [ticker,raw]=await Promise.all([
    getJson("https://data-api.binance.vision/api/v3/ticker/24hr?symbol=SOLUSDT"),
    getJson(`https://data-api.binance.vision/api/v3/klines?symbol=SOLUSDT&interval=${interval}&limit=180`)
  ]);
  currentPrice=Number(ticker.lastPrice);
  $("price").textContent=money(currentPrice);
  const ch=Number(ticker.priceChangePercent);
  $("change").textContent=(ch>=0?"+":"")+ch.toFixed(2)+"% · 24 h";
  $("change").style.color=ch>=0?"var(--green)":"var(--red)";
  $("change").style.background=ch>=0?"#253a35":"#3b222c";
  candles=raw.map(k=>({t:k[0],o:+k[1],h:+k[2],l:+k[3],c:+k[4],v:+k[5]}));
  $("updated").textContent="Actualizado: "+new Date().toLocaleString("es-ES")+" · Binance Spot";
  $("chartRange").textContent=`${candles.length} velas · ${interval==="1d"?"diario":"semanal"}`;
  calcIndicators(); detectPivots(); drawChart(); renderWaves();
}
async function loadFearGreed(){
  try{
    const d=await getJson("https://api.alternative.me/fng/?limit=8");
    const x=d.data?.[0];if(!x)throw new Error("Sin datos");
    const v=Number(x.value);
    $("fngValue").innerHTML=`${v}<small>/100</small>`;
    $("fngLabel").textContent=x.value_classification;
    $("fngBar").style.width=v+"%";
    $("fngDate").textContent=new Date(Number(x.timestamp)*1000).toLocaleDateString("es-ES",{day:"2-digit",month:"short"});
    const recent=d.data.slice(0,7).map(a=>Number(a.value));
    const avg=recent.reduce((a,b)=>a+b,0)/recent.length;
    $("fngLabel").textContent=x.value_classification+" · 7d media "+avg.toFixed(0);
  }catch(e){$("fngLabel").textContent="Índice no disponible";toast("No se pudo cargar Fear & Greed. Comprueba la conexión.")}
}
function average(a,n){return a.length<n?null:a.slice(-n).reduce((s,x)=>s+x.c,0)/n}
function calcIndicators(){
 const ma20=average(candles,20),ma50=average(candles,50),last=candles.at(-1)?.c;
 $("ma20").textContent=ma20?money(ma20):"—";$("ma50").textContent=ma50?money(ma50):"—";
 if(!ma20||!ma50)return;
 let t="Tendencia mixta",note="Precio entre medias o medias sin alineación clara.";
 if(last>ma20&&ma20>ma50){t="Alcista";note="Precio sobre MA20 y MA20 sobre MA50. Confirmar con estructura y volumen."}
 else if(last<ma20&&ma20<ma50){t="Bajista";note="Precio bajo MA20 y MA20 bajo MA50. Evitar asumir que una caída es suelo."}
 else if(last>ma20){t="Rebote / recuperación";note="Precio sobre MA20, pero la tendencia larga aún no confirma."}
 else {t="Debilidad";note="Precio bajo MA20; esperar recuperación o nueva estructura."}
 $("trend").textContent=t;$("trendNote").textContent=note;
}
function findPivots(){
 const p=[];const w=3;
 for(let i=w;i<candles.length-w;i++){
   const hi=candles[i].h,lo=candles[i].l;
   let top=true,bot=true;
   for(let j=i-w;j<=i+w;j++){if(j===i)continue;if(candles[j].h>=hi)top=false;if(candles[j].l<=lo)bot=false}
   if(top)p.push({i,price:hi,type:"H",t:candles[i].t});
   if(bot)p.push({i,price:lo,type:"L",t:candles[i].t});
 }
 p.sort((a,b)=>a.i-b.i);
 const compact=[];
 for(const x of p){
   const last=compact.at(-1);
   if(last&&last.type===x.type){if((x.type==="H"&&x.price>last.price)||(x.type==="L"&&x.price<last.price))compact[compact.length-1]=x}
   else compact.push(x);
 }
 return compact.slice(-10);
}
function detectPivots(){pivots=findPivots()}
function drawChart(){
 const canvas=$("priceChart"),ctx=canvas.getContext("2d"),ratio=window.devicePixelRatio||1,w=canvas.clientWidth||600,h=260;
 canvas.width=w*ratio;canvas.height=h*ratio;ctx.scale(ratio,ratio);ctx.clearRect(0,0,w,h);
 if(candles.length<2)return;
 const vals=candles.map(c=>c.c),min=Math.min(...candles.map(c=>c.l)),max=Math.max(...candles.map(c=>c.h)),pad={l:8,r:58,t:15,b:23};
 const lo=min-(max-min)*.07,hi=max+(max-min)*.07;
 const x=i=>pad.l+i/(candles.length-1)*(w-pad.l-pad.r),y=v=>pad.t+(hi-v)/(hi-lo)*(h-pad.t-pad.b);
 ctx.font="10px system-ui";ctx.strokeStyle="#292d40";ctx.fillStyle="#9298af";ctx.lineWidth=1;
 for(let j=0;j<5;j++){const yy=pad.t+j*(h-pad.t-pad.b)/4;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();ctx.fillText(money(hi-j*(hi-lo)/4),w-pad.r+5,yy+3)}
 ctx.beginPath();vals.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.strokeStyle="#a78bfa";ctx.lineWidth=2;ctx.stroke();
 const area=ctx.createLinearGradient(0,pad.t,0,h-pad.b);area.addColorStop(0,"#8b5cf633");area.addColorStop(1,"#8b5cf600");ctx.lineTo(x(vals.length-1),h-pad.b);ctx.lineTo(x(0),h-pad.b);ctx.closePath();ctx.fillStyle=area;ctx.fill();
 pivots.forEach(p=>{ctx.beginPath();ctx.arc(x(p.i),y(p.price),3.4,0,Math.PI*2);ctx.fillStyle=p.type==="H"?"#fb7185":"#4adea5";ctx.fill();ctx.fillStyle="#dfe1ee";ctx.font="10px system-ui";ctx.fillText(p.type,x(p.i)-3,y(p.price)+(p.type==="H"?-8:14))});
 ctx.fillStyle="#9298af";ctx.fillText(shortDate(candles[0].t),pad.l,h-5);ctx.fillText(shortDate(candles.at(-1).t),Math.max(pad.l,w-pad.r-35),h-5);
}
function renderWaves(){
 if(pivots.length<4){$("waveStatus").textContent="Datos insuficientes";$("waveSummary").textContent="Aún no hay suficientes pivotes claros para sugerir una estructura. Prueba el intervalo semanal o actualiza más adelante.";return}
 const last=pivots.at(-1),prev=pivots.at(-2),prev2=pivots.at(-3),prev3=pivots.at(-4);
 const fmt=money;
 const up=last.price>prev.price, impulse=Math.abs(prev.price-prev2.price);
 let label="Estructura correctiva o mixta";
 if(last.type==="H"&&last.price>prev2.price&&prev2.price>prev3.price)label="Posible impulso alcista (recuento no confirmado)";
 else if(last.type==="L"&&last.price<prev2.price&&prev2.price<prev3.price)label="Posible impulso bajista (recuento no confirmado)";
 $("waveStatus").textContent="Hipótesis técnica";
 $("waveSummary").innerHTML=`<strong>${label}</strong><br>Últimos pivotes: ${prev3.type} ${fmt(prev3.price)} → ${prev2.type} ${fmt(prev2.price)} → ${prev.type} ${fmt(prev.price)} → ${last.type} ${fmt(last.price)}. <span style="color:var(--muted)">Los números de onda no se pueden confirmar solo con una regla automática.</span>`;
 // Fibonacci retracement from latest completed swing
 const swingLow=Math.min(prev.price,last.price),swingHigh=Math.max(prev.price,last.price),range=swingHigh-swingLow;
 const z1=swingHigh-range*.618,z2=swingHigh-range*.382;
 const stop=Math.min(prev3.price,prev2.price,last.price)*.99;
 const target=swingHigh+range;
 $("entryZone").textContent=up?`${fmt(Math.min(z1,z2))} – ${fmt(Math.max(z1,z2))}`:`Esperar recuperación`;
 $("invalidation").textContent=fmt(stop);
 $("target").textContent=fmt(target);
 const el=$("entrySignal");
 if(currentPrice>=Math.min(z1,z2)&&currentPrice<=Math.max(z1,z2)&&up){
   el.className="signal neutral";el.innerHTML="<span class='signal-icon'>◎</span><div><strong>Precio dentro de zona Fibonacci</strong><p>Es una zona de observación, no una compra automática. Busca confirmación alcista y revisa el stop.</p></div>";
 }else{
   el.className="signal neutral";el.innerHTML="<span class='signal-icon'>◎</span><div><strong>Esperar confirmación</strong><p>El precio no está en una zona de entrada validada por este método simplificado. No persigas el precio.</p></div>";
 }
}
function calculatePosition(){
 const capital=Number($("capital").value),risk=Number($("risk").value)/100,entry=Number($("calcEntry").value),stop=Number($("calcStop").value);
 if(!(capital>0&&risk>0&&entry>0&&stop>0&&stop<entry)){ $("calcResult").textContent="Comprueba los valores: en spot, el stop debe estar por debajo de la entrada y todos los importes deben ser positivos.";return}
 const riskUsd=capital*risk,qty=riskUsd/(entry-stop),cost=qty*entry;
 $("calcResult").innerHTML=`Riesgo teórico: <strong>${money(riskUsd)}</strong> · Cantidad aproximada: <strong>${qty.toFixed(5)} SOL</strong> · Capital necesario: <strong>${money(cost)}</strong>. ${cost>capital?"Aviso: supera el capital introducido; reduce el tamaño.":""} No incluye comisiones, deslizamiento ni gaps.`;
}
$("refreshBtn").addEventListener("click",async()=>{try{await loadPrice();await loadFearGreed();toast("Datos actualizados")}catch(e){toast("No se pudieron cargar los datos: "+e.message)}});
document.querySelectorAll("[data-interval]").forEach(b=>b.addEventListener("click",async()=>{interval=b.dataset.interval;document.querySelectorAll("[data-interval]").forEach(x=>x.classList.toggle("active",x===b));try{await loadPrice()}catch(e){toast("No se pudo cambiar el intervalo")}}));
$("calcBtn").addEventListener("click",calculatePosition);
window.addEventListener("resize",()=>drawChart());
async function start(){try{await loadPrice()}catch(e){$("price").textContent="Sin conexión";$("updated").textContent="No se pudo conectar con Binance. Comprueba la conexión y pulsa Actualizar.";toast("Error al cargar el mercado")}await loadFearGreed()}
start();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));