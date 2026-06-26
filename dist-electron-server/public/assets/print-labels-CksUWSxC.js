import{r as g,o as y}from"./index-Dw7cFs0f.js";const d={mode:"a4",printerName:"",a4:{columns:3,marginMm:8,gapMm:3,labelHeightMm:30,showPrice:!0,showBatch:!0,showExpiry:!0},thermal:{widthMm:50,heightMm:30,marginMm:2,barcodeHeightMm:12,fontSizePt:8,showPrice:!1,showBatch:!0,showExpiry:!0}},u="pharmasys.label-settings.v1";function b(){if(typeof window>"u")return d;try{const e=window.localStorage.getItem(u);if(!e)return d;const t=JSON.parse(e);return{...d,...t,a4:{...d.a4,...t.a4??{}},thermal:{...d.thermal,...t.thermal??{}}}}catch{return d}}function v(){return b()}function j(){const[e,t]=g.useState(()=>b());g.useEffect(()=>{function i(s){s.key===u&&t(b())}return window.addEventListener("storage",i),()=>window.removeEventListener("storage",i)},[]);const n=g.useCallback(i=>{t(s=>{const m=typeof i=="function"?i(s):{...s,...i};try{window.localStorage.setItem(u,JSON.stringify(m))}catch{}return m})},[]),r=g.useCallback(()=>{try{window.localStorage.removeItem(u)}catch{}t(d)},[]);return{settings:e,update:n,reset:r}}function c(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function $(e){if(!e)return"";const[t,n,r]=e.split("-");return!t||!n||!r?e:`${r}/${n}/${t}`}function x(e){return e.flatMap((t,n)=>Array.from({length:Math.max(0,Math.floor(t.qty))}).map((r,i)=>({id:`bc_${n}_${i}`,name:t.name,barcode:t.barcode,price:t.price??null,lote:t.batch_number??null,val:t.expiry_date??null})))}function z(e,t){const n={...v()},r=x(e);if(r.length===0)return;const i=window.open("","_blank","width=900,height=700");if(!i)return;const s=n.mode==="thermal"?S(r,n):M(r,n);i.document.write(s),i.document.close()}function M(e,t){const{columns:n,marginMm:r,gapMm:i,labelHeightMm:s,showPrice:m,showBatch:p,showExpiry:l}=t.a4,h=e.map(a=>`
    <div class="label">
      <div class="name">${c(a.name)}</div>
      <svg id="${a.id}" class="bc"></svg>
      ${p&&a.lote||l&&a.val?`
      <div class="meta">
        ${p&&a.lote?`<span>Lote: ${c(a.lote)}</span>`:""}
        ${l&&a.val?`<span>Val: ${$(a.val)}</span>`:""}
      </div>`:""}
      ${m&&a.price!=null?`<div class="price">${c(y(a.price))}</div>`:""}
    </div>
  `).join(""),f=e.map(a=>`JsBarcode(document.getElementById(${JSON.stringify(a.id)}), ${JSON.stringify(a.barcode)}, { format:'CODE128', height:34, width:1.3, fontSize:9, margin:0 });`).join(`
`),w=t.printerName?`<div class="hint">Impressora sugerida: <b>${c(t.printerName)}</b></div>`:"";return`<!doctype html><html><head><title>Etiquetas A4</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
    <style>
      @page { size: A4; margin: ${r}mm; }
      body { font-family: system-ui, sans-serif; margin: 0; }
      .hint { font-size: 11px; color:#555; margin-bottom: 4mm; }
      .grid { display: grid; grid-template-columns: repeat(${n}, 1fr); gap: ${i}mm; }
      .label { border: 1px dashed #ccc; padding: 2mm; text-align: center; page-break-inside: avoid; height: ${s}mm; display:flex; flex-direction:column; justify-content:center; overflow:hidden; }
      .name { font-size: 10px; font-weight: 600; margin-bottom: 1mm; line-height: 1.1; max-height: 2.4em; overflow:hidden; }
      .bc { width: 100%; height: 38%; }
      .meta { display:flex; justify-content:space-between; gap:4px; font-size: 8px; color: #333; margin-top: 1mm; }
      .price { font-size: 11px; font-weight: 700; margin-top: 1mm; }
      @media print { .label { border-color: transparent; } .hint { display:none; } }
    </style></head><body>
    ${w}
    <div class="grid">${h}</div>
    <script>
      window.onload = function(){
        ${f}
        setTimeout(function(){ window.print(); }, 350);
      };
    <\/script></body></html>`}function S(e,t){const{widthMm:n,heightMm:r,marginMm:i,barcodeHeightMm:s,fontSizePt:m,showPrice:p,showBatch:l,showExpiry:h}=t.thermal,f=e.map(o=>`
    <div class="label">
      <div class="name">${c(o.name)}</div>
      <svg id="${o.id}" class="bc"></svg>
      ${l&&o.lote||h&&o.val?`
      <div class="meta">
        ${l&&o.lote?`<span>L:${c(o.lote)}</span>`:""}
        ${h&&o.val?`<span>V:${$(o.val)}</span>`:""}
      </div>`:""}
      ${p&&o.price!=null?`<div class="price">${c(y(o.price))}</div>`:""}
    </div>
  `).join(""),w=e.map(o=>`JsBarcode(document.getElementById(${JSON.stringify(o.id)}), ${JSON.stringify(o.barcode)}, { format:'CODE128', height:${Math.round(s*3.78)}, width:1.2, fontSize:${Math.max(6,m-1)}, margin:0, displayValue:true });`).join(`
`),a=t.printerName?`<div class="hint">Impressora sugerida: <b>${c(t.printerName)}</b></div>`:"";return`<!doctype html><html><head><title>Etiquetas térmicas</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
    <style>
      @page { size: ${n}mm ${r}mm; margin: 0; }
      body { font-family: system-ui, sans-serif; margin: 0; font-size: ${m}pt; }
      .hint { font-size: 11px; color:#555; padding: 4px 8px; }
      .label {
        width: ${n}mm; height: ${r}mm;
        padding: ${i}mm; box-sizing: border-box;
        display: flex; flex-direction: column; justify-content: center; text-align: center;
        page-break-after: always; overflow: hidden;
      }
      .label:last-child { page-break-after: auto; }
      .name { font-weight: 700; line-height: 1.1; max-height: 2.4em; overflow: hidden; margin-bottom: 1mm; }
      .bc { width: 100%; height: ${s}mm; }
      .meta { display:flex; justify-content:space-between; gap:2mm; margin-top: 0.5mm; font-size: ${Math.max(6,m-1)}pt; }
      .price { font-weight: 800; margin-top: 0.5mm; }
      @media print { .hint { display: none; } }
    </style></head><body>
    ${a}
    ${f}
    <script>
      window.onload = function(){
        ${w}
        setTimeout(function(){ window.print(); }, 350);
      };
    <\/script></body></html>`}export{d as D,z as p,j as u};
