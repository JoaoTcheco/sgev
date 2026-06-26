import{r as g,g as u}from"./electron-index-OHQ1Uw1g.js";const l={mode:"a4",printerName:"",a4:{columns:3,marginMm:8,gapMm:3,labelHeightMm:30,showPrice:!0,showCost:!1,showBatch:!0,showExpiry:!0},thermal:{widthMm:50,heightMm:30,marginMm:2,barcodeHeightMm:12,fontSizePt:8,showPrice:!1,showCost:!1,showBatch:!0,showExpiry:!0}},f="pharmasys.label-settings.v1";function $(){if(typeof window>"u")return l;try{const e=window.localStorage.getItem(f);if(!e)return l;const t=JSON.parse(e);return{...l,...t,a4:{...l.a4,...t.a4??{}},thermal:{...l.thermal,...t.thermal??{}}}}catch{return l}}function x(){return $()}function z(){const[e,t]=g.useState(()=>$());g.useEffect(()=>{function n(r){r.key===f&&t($())}return window.addEventListener("storage",n),()=>window.removeEventListener("storage",n)},[]);const a=g.useCallback(n=>{t(r=>{const m=typeof n=="function"?n(r):{...r,...n};try{window.localStorage.setItem(f,JSON.stringify(m))}catch{}return m})},[]),o=g.useCallback(()=>{try{window.localStorage.removeItem(f)}catch{}t(l)},[]);return{settings:e,update:a,reset:o}}function c(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function v(e){if(!e)return"";const[t,a,o]=e.split("-");return!t||!a||!o?e:`${o}/${a}/${t}`}function M(e){return e.flatMap((t,a)=>Array.from({length:Math.max(0,Math.floor(t.qty))}).map((o,n)=>({id:`bc_${a}_${n}`,name:t.name,barcode:t.barcode,price:t.price??null,cost:t.cost??null,lote:t.batch_number??null,val:t.expiry_date??null})))}function N(e,t){const a={...x()},o=M(e);if(o.length===0)return;const n=window.open("","_blank","width=900,height=700");if(!n)return;const r=a.mode==="thermal"?E(o,a):S(o,a);n.document.write(r),n.document.close()}function S(e,t){const{columns:a,marginMm:o,gapMm:n,labelHeightMm:r,showPrice:m,showBatch:p,showExpiry:d,showCost:h}=t.a4,w=e.map(i=>`
    <div class="label">
      <div class="name">${c(i.name)}</div>
      <svg id="${i.id}" class="bc"></svg>
      ${p&&i.lote||d&&i.val?`
      <div class="meta">
        ${p&&i.lote?`<span>Lote: ${c(i.lote)}</span>`:""}
        ${d&&i.val?`<span>Val: ${v(i.val)}</span>`:""}
      </div>`:""}
      <div class="prices">
        ${m&&i.price!=null?`<span class="price">${c(u(i.price))}</span>`:""}
        ${h&&i.cost!=null?`<span class="cost">Custo: ${c(u(i.cost))}</span>`:""}
      </div>
    </div>
  `).join(""),b=e.map(i=>`JsBarcode(document.getElementById(${JSON.stringify(i.id)}), ${JSON.stringify(i.barcode)}, { format:'CODE128', height:34, width:1.3, fontSize:9, margin:0 });`).join(`
`),y=t.printerName?`<div class="hint">Impressora sugerida: <b>${c(t.printerName)}</b></div>`:"";return`<!doctype html><html><head><title>Etiquetas A4</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
    <style>
      @page { size: A4; margin: ${o}mm; }
      body { font-family: system-ui, sans-serif; margin: 0; }
      .hint { font-size: 11px; color:#555; margin-bottom: 4mm; }
      .grid { display: grid; grid-template-columns: repeat(${a}, 1fr); gap: ${n}mm; }
      .label { border: 1px dashed #ccc; padding: 2mm; text-align: center; page-break-inside: avoid; height: ${r}mm; display:flex; flex-direction:column; justify-content:center; overflow:hidden; }
      .name { font-size: 10px; font-weight: 600; margin-bottom: 1mm; line-height: 1.1; max-height: 2.4em; overflow:hidden; }
      .bc { width: 100%; height: 38%; }
      .meta { display:flex; justify-content:space-between; gap:4px; font-size: 8px; color: #333; margin-top: 1mm; }
      .prices { display:flex; justify-content:space-between; align-items:baseline; gap:6px; margin-top: 1mm; }
      .price { font-size: 11px; font-weight: 700; }
      .cost { font-size: 8px; color:#555; font-weight: 600; }
      @media print { .label { border-color: transparent; } .hint { display:none; } }
    </style></head><body>
    ${y}
    <div class="grid">${w}</div>
    <script>
      window.onload = function(){
        ${b}
        setTimeout(function(){ window.print(); }, 350);
      };
    <\/script></body></html>`}function E(e,t){const{widthMm:a,heightMm:o,marginMm:n,barcodeHeightMm:r,fontSizePt:m,showPrice:p,showBatch:d,showExpiry:h,showCost:w}=t.thermal,b=e.map(s=>`
    <div class="label">
      <div class="name">${c(s.name)}</div>
      <svg id="${s.id}" class="bc"></svg>
      ${d&&s.lote||h&&s.val?`
      <div class="meta">
        ${d&&s.lote?`<span>L:${c(s.lote)}</span>`:""}
        ${h&&s.val?`<span>V:${v(s.val)}</span>`:""}
      </div>`:""}
      <div class="prices">
        ${p&&s.price!=null?`<span class="price">${c(u(s.price))}</span>`:""}
        ${w&&s.cost!=null?`<span class="cost">C: ${c(u(s.cost))}</span>`:""}
      </div>
    </div>
  `).join(""),y=e.map(s=>`JsBarcode(document.getElementById(${JSON.stringify(s.id)}), ${JSON.stringify(s.barcode)}, { format:'CODE128', height:${Math.round(r*3.78)}, width:1.2, fontSize:${Math.max(6,m-1)}, margin:0, displayValue:true });`).join(`
`),i=t.printerName?`<div class="hint">Impressora sugerida: <b>${c(t.printerName)}</b></div>`:"";return`<!doctype html><html><head><title>Etiquetas térmicas</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
    <style>
      @page { size: ${a}mm ${o}mm; margin: 0; }
      body { font-family: system-ui, sans-serif; margin: 0; font-size: ${m}pt; }
      .hint { font-size: 11px; color:#555; padding: 4px 8px; }
      .label {
        width: ${a}mm; height: ${o}mm;
        padding: ${n}mm; box-sizing: border-box;
        display: flex; flex-direction: column; justify-content: center; text-align: center;
        page-break-after: always; overflow: hidden;
      }
      .label:last-child { page-break-after: auto; }
      .name { font-weight: 700; line-height: 1.1; max-height: 2.4em; overflow: hidden; margin-bottom: 1mm; }
      .bc { width: 100%; height: ${r}mm; }
      .meta { display:flex; justify-content:space-between; gap:2mm; margin-top: 0.5mm; font-size: ${Math.max(6,m-1)}pt; }
      .prices { display:flex; justify-content:space-between; gap:2mm; margin-top: 0.5mm; }
      .price { font-weight: 800; }
      .cost { font-weight: 600; font-size: ${Math.max(6,m-1)}pt; color:#444; }
      @media print { .hint { display: none; } }
    </style></head><body>
    ${i}
    ${b}
    <script>
      window.onload = function(){
        ${y}
        setTimeout(function(){ window.print(); }, 350);
      };
    <\/script></body></html>`}export{l as D,N as p,z as u};
