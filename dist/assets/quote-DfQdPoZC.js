import{c as oe,P as G,b as Y,R as W,M as k,F as P,f as y,d as J,e as q,g as re,a as X,h as se}from"./roof3d-CsH3WjnM.js";/* empty css               */import"./three-i9_Q6tKE.js";let F=3;const e={tierId:"premium",profileId:"longspan",colorId:"red",unit:"m",rows:[{id:1,qty:12,length:4}],deliveryMode:"delivery",distanceKm:3,customerName:"",customerContact:"",customerAddress:"",customerNotes:""};let M=null;function ie(){const t=new URLSearchParams(window.location.search),o=t.get("tier"),n=t.get("profile"),i=t.get("color");o&&G.some(l=>l.id===o)&&(e.tierId=o),n&&Y.some(l=>l.id===n)&&(e.profileId=n),i&&W.some(l=>l.id===i)&&(e.colorId=i)}function Z(){const t=q(e.tierId);return t.prices[e.profileId]||t.prices.longspan}function A(){const t=q(e.tierId),o=re(e.profileId),n=X(e.colorId),i=Z(),l=+(i*P).toFixed(2),r=e.rows.map(c=>{const p=Math.max(0,Math.floor(Number(c.qty)||0)),B=Math.max(0,Number(c.length)||0),g=se(B,e.unit),$=p*g,I=+($*i).toFixed(2);return{...c,qty:p,rawLen:B,metersPerSheet:g,totalLinearMeters:$,rowSubtotal:I}}),d=r.filter(c=>c.qty>0&&c.rawLen>0),m=d.reduce((c,p)=>c+p.qty,0),b=d.reduce((c,p)=>c+p.totalLinearMeters,0),x=d.reduce((c,p)=>c+p.rowSubtotal,0),h=J(e.deliveryMode,e.distanceKm),w=+(x+h.fee).toFixed(2);return{tier:t,profile:o,color:n,pricePerMeter:i,effectivePricePerFoot:l,computedRows:r,validRows:d,totalSheets:m,totalMeters:b,roofingSubtotal:x,delivery:h,grandTotal:w}}function ae(){const t=document.getElementById("quoteTierCards");t&&(t.innerHTML=G.map(o=>{const n=o.id===e.tierId;return o.prices[e.profileId],`
      <button
        type="button"
        role="radio"
        aria-checked="${n}"
        data-tier-card="${o.id}"
        class="btn-interactive text-left rounded-2xl p-4 sm:p-6 border ${n?"bg-[#F9EBEC] border-2 border-[#9E1B22]":"bg-white border-black/10 hover:border-black/25"} flex flex-col justify-between gap-4 cursor-pointer"
      >
        <div class="flex flex-col gap-2 w-full">
          <div class="flex items-center justify-between gap-2">
            <span class="caption-3 font-mono-num ${n?"text-[#9E1B22]":"text-[#6E6E6A]"}">
              ${o.number} · ${o.thickness}
            </span>
            <span class="py-0.5 px-2 rounded-full ${n?"bg-[#9E1B22] text-white":"bg-[#F4F3F1] text-[#4A4A48]"} caption-3">
              ${n?"Selected":"Select"}
            </span>
          </div>

          <span class="heading-6 text-[#181818]">${o.name}</span>
          <span class="caption-2 text-[#4A4A48]">${o.tagline}</span>
        </div>

        <div class="w-full rounded-xl p-3 bg-white border border-black/10 flex flex-col gap-2">
          <div class="flex items-baseline justify-between gap-2">
            <span class="caption-1 ${e.profileId==="longspan"?"text-[#181818]":"text-[#6E6E6A]"}">
              Long Span (8 Ribs)
            </span>
            <span class="body-4 font-mono-num ${e.profileId==="longspan"&&n?"text-[#9E1B22]":"text-[#181818]"}">
              ₱${o.prices.longspan} / m
            </span>
          </div>
          <div class="h-px w-full bg-black/10"></div>
          <div class="flex items-baseline justify-between gap-2">
            <span class="caption-1 ${e.profileId==="tilespan"?"text-[#181818]":"text-[#6E6E6A]"}">
              Tile Span Roofing
            </span>
            <span class="body-4 font-mono-num ${e.profileId==="tilespan"&&n?"text-[#9E1B22]":"text-[#181818]"}">
              ₱${o.prices.tilespan} / m
            </span>
          </div>
        </div>
      </button>
    `}).join(""))}function le(){const t=q(e.tierId),o=document.getElementById("quoteProfileButtons"),n=document.getElementById("quoteColorSwatches"),i=document.getElementById("quoteSelectedColorLabel");o&&(o.innerHTML=Y.map(r=>{const d=r.id===e.profileId,m=t.prices[r.id];return`
        <button
          type="button"
          role="radio"
          aria-checked="${d}"
          data-quote-profile="${r.id}"
          class="btn-interactive rounded-xl p-4 text-left border ${d?"bg-[#F9EBEC] border-2 border-[#9E1B22]":"bg-white border-black/10 hover:border-black/25"} flex flex-col gap-2 cursor-pointer"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="title-2 text-[#181818]">${r.shortName}</span>
            <span class="heading-6 font-mono-num ${d?"text-[#9E1B22]":"text-[#181818]"}">
              ₱${m} <span class="caption-2 text-[#6E6E6A]">/ m</span>
            </span>
          </div>
          <p class="caption-2 text-[#4A4A48]">${r.summary}</p>
        </button>
      `}).join(""));const l=X(e.colorId);i&&(i.textContent=`${l.name} (${l.hex})`),n&&(n.innerHTML=W.map(r=>`
      <button
        type="button"
        role="radio"
        aria-checked="${r.id===e.colorId}"
        aria-label="${r.name}"
        data-quote-color="${r.id}"
        class="color-swatch-btn flex items-center gap-2 py-2 px-3 rounded-xl border ${r.id===e.colorId?"bg-white border-2 border-[#181818]":"bg-white border-black/10 hover:border-black/25"} cursor-pointer"
      >
        <span
          class="w-5 h-5 rounded-full border border-black/15 shrink-0"
          style="background-color: ${r.hex};"
        ></span>
        <span class="caption-1 text-[#181818]">${r.name}</span>
      </button>
    `).join(""))}function de(){const t=document.getElementById("unitBtnMeters"),o=document.getElementById("unitBtnFeet"),n=document.getElementById("unitConversionHelper"),i=document.getElementById("lengthPresetChips"),l=e.unit==="m",r=Z(),d=(r*P).toFixed(2);if(t&&o&&(t.setAttribute("aria-pressed",String(l)),o.setAttribute("aria-pressed",String(!l)),t.className=l?"btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer":"btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm cursor-pointer",o.className=l?"btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm cursor-pointer":"btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer"),n&&(n.textContent=l?`Active rate: ₱${r} per linear meter (1 m = 3.2808 ft)`:`Active rate: ₱${r} per linear meter · Exact conversion: 1 ft = 0.3048 m (≈ ₱${d} per linear foot)`),i){const m=l?[2.5,3,3.6,4,5,6]:[8,10,12,14,16,20];i.innerHTML=m.map(b=>`
        <button
          type="button"
          data-length-preset="${b}"
          class="btn-interactive py-1 px-3 rounded-lg bg-white border border-black/10 hover:border-black/30 caption-3 font-mono-num text-[#181818] cursor-pointer"
        >
          ${b} ${e.unit}
        </button>
      `).join("")}}function ce(){const t=document.getElementById("sheetCutRowsMount");if(!t)return;if(!e.rows.length){t.innerHTML=`
      <div class="rounded-2xl p-6 bg-white border border-black/10 flex flex-col items-center text-center gap-3">
        <span class="title-3 text-[#181818]">No sheet cuts in your list yet</span>
        <p class="caption-2 text-[#6E6E6A]">Add at least one custom cut row with sheet quantity and length to calculate your roofing subtotal.</p>
        <button
          type="button"
          id="restoreSampleRowBtn"
          class="btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer"
        >
          Add sample 10 sheet cut
        </button>
      </div>
    `;const n=document.getElementById("restoreSampleRowBtn");n&&n.addEventListener("click",()=>{e.rows.push({id:F++,qty:10,length:e.unit==="m"?4:12}),v()});return}const o=A();t.innerHTML=o.computedRows.map((n,i)=>{const l=e.unit==="ft"?`${n.rawLen||0} ft = ${n.metersPerSheet.toFixed(3)} m per sheet · ${n.totalLinearMeters.toFixed(2)} m total`:`${n.totalLinearMeters.toFixed(2)} linear meters total (${(n.totalLinearMeters*k).toFixed(1)} ft)`;return`
        <div class="rounded-2xl p-4 bg-white border border-black/10 flex flex-col gap-3" data-row-id="${n.id}">
          <div class="flex items-center justify-between gap-2">
            <span class="caption-3 uppercase tracking-wider text-[#6E6E6A]">
              Sheet cut #${i+1}
            </span>
            ${e.rows.length>1?`<button
                    type="button"
                    data-remove-row="${n.id}"
                    class="caption-3 text-[#9E1B22] hover:underline cursor-pointer"
                  >
                    Remove cut
                  </button>`:""}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div class="sm:col-span-4 flex flex-col gap-1">
              <label for="qtyInput_${n.id}" class="caption-1 text-[#4A4A48]">
                Quantity (sheets)
              </label>
              <input
                id="qtyInput_${n.id}"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-row-qty="${n.id}"
                value="${n.qty}"
                class="w-full py-2 px-3 rounded-lg bg-[#F4F3F1] border border-black/15 font-mono-num body-2 text-[#181818]"
              />
            </div>

            <div class="sm:col-span-5 flex flex-col gap-1">
              <label for="lenInput_${n.id}" class="caption-1 text-[#4A4A48]">
                Length per sheet (${e.unit==="m"?"meters":"feet"})
              </label>
              <div class="relative flex items-center">
                <input
                  id="lenInput_${n.id}"
                  type="number"
                  min="0.1"
                  step="0.1"
                  inputmode="decimal"
                  data-row-len="${n.id}"
                  value="${n.length}"
                  class="w-full py-2 pl-3 pr-12 rounded-lg bg-[#F4F3F1] border border-black/15 font-mono-num body-2 text-[#181818]"
                />
                <span class="absolute right-3 caption-3 font-mono-num text-[#6E6E6A] pointer-events-none">
                  ${e.unit}
                </span>
              </div>
            </div>

            <div class="sm:col-span-3 flex flex-col sm:items-end justify-end">
              <span class="caption-4 text-[#6E6E6A]">Row cost</span>
              <span class="title-2 font-mono-num text-[#181818]" data-row-subtotal="${n.id}">
                ${y(n.rowSubtotal)}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 pt-1">
            <span class="caption-4 font-mono-num text-[#6E6E6A]" data-row-meta="${n.id}">
              ${l}
            </span>
          </div>
        </div>
      `}).join("")}function V(){A().computedRows.forEach(o=>{const n=document.querySelector(`[data-row-subtotal="${o.id}"]`),i=document.querySelector(`[data-row-meta="${o.id}"]`);n&&(n.textContent=y(o.rowSubtotal)),i&&(i.textContent=e.unit==="ft"?`${o.rawLen||0} ft = ${o.metersPerSheet.toFixed(3)} m per sheet · ${o.totalLinearMeters.toFixed(2)} m total`:`${o.totalLinearMeters.toFixed(2)} linear meters total (${(o.totalLinearMeters*k).toFixed(1)} ft)`)})}function S(){const t=document.getElementById("modeBtnDelivery"),o=document.getElementById("modeBtnPickup"),n=document.getElementById("deliveryDistancePanel"),i=document.getElementById("distanceKmInput"),l=document.getElementById("deliveryStatusBadge"),r=document.getElementById("deliveryFormulaText"),d=e.deliveryMode==="delivery";t&&o&&(t.setAttribute("aria-pressed",String(d)),o.setAttribute("aria-pressed",String(!d)),t.className=d?"btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer":"btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm cursor-pointer",o.className=d?"btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm cursor-pointer":"btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer"),n&&n.classList.toggle("hidden",!d),i&&document.activeElement!==i&&(i.value=e.distanceKm);const m=J(e.deliveryMode,e.distanceKm);l&&(m.fee===0?(l.textContent="FREE (₱0.00)",l.className="py-1 px-3 rounded-full bg-[#E7F4EC] text-[#1D6335] caption-3 font-mono-num"):(l.textContent=y(m.fee),l.className="py-1 px-3 rounded-full bg-[#F9EBEC] text-[#9E1B22] caption-3 font-mono-num")),r&&(r.textContent=m.explanation)}function C(){const t=A(),o=document.getElementById("summaryTierName"),n=document.getElementById("summaryProfileName"),i=document.getElementById("summaryColorName"),l=document.getElementById("summaryColorDot"),r=document.getElementById("summaryRatePerMeter"),d=document.getElementById("summaryTotalSheets"),m=document.getElementById("summaryTotalMeters"),b=document.getElementById("summaryRoofSubtotal"),x=document.getElementById("summaryDeliveryFee"),h=document.getElementById("summaryDeliveryNote"),w=document.getElementById("summaryGrandTotal"),c=document.getElementById("summaryCutBreakdown"),p=document.getElementById("quote3DBadge");o&&(o.textContent=`${t.tier.name} (${t.tier.thickness})`),n&&(n.textContent=t.profile.shortName),i&&(i.textContent=t.color.name),l&&(l.style.backgroundColor=t.color.hex),r&&(r.textContent=`₱${t.pricePerMeter} / m`),d&&(d.textContent=`${t.totalSheets} pcs`),m&&(m.textContent=`${t.totalMeters.toFixed(2)} m (${(t.totalMeters*k).toFixed(1)} ft)`),b&&(b.textContent=y(t.roofingSubtotal)),x&&(x.textContent=t.delivery.fee===0?"FREE (₱0.00)":y(t.delivery.fee)),h&&(h.textContent=t.delivery.explanation),w&&(w.textContent=y(t.grandTotal)),p&&(p.textContent=`${t.profile.shortName} · ${t.color.name}`),c&&(t.validRows.length?c.innerHTML=t.validRows.map((g,$)=>{const I=e.unit==="ft"?`${g.qty} pcs × ${g.rawLen} ft (${g.metersPerSheet.toFixed(2)} m)`:`${g.qty} pcs × ${g.rawLen} m`;return`
            ${$>0?'<div class="h-px w-full bg-black/10"></div>':""}
            <div class="py-2 flex items-center justify-between gap-2">
              <span class="caption-2 font-mono-num text-[#4A4A48]">${I}</span>
              <span class="caption-1 font-mono-num text-[#181818]">${y(g.rowSubtotal)}</span>
            </div>
          `}).join(""):c.innerHTML='<p class="caption-2 text-[#6E6E6A]">Enter at least one valid sheet quantity and length to see itemized line totals.</p>');const B=document.getElementById("printQuoteDate");B&&(B.textContent=new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"}))}function z(){const t=A(),o=["CAB STEEL METAL FABRICATION — QUOTE REQUEST",`Product Tier: ${t.tier.name} (${t.tier.thickness})`,`Roofing Profile: ${t.profile.name}`,`Color: ${t.color.name}`,`Rate: PHP ${t.pricePerMeter} / linear meter`,"","CUSTOM CUTTING LIST:"];return t.validRows.forEach((n,i)=>{e.unit==="ft"?o.push(`${i+1}. ${n.qty} pcs x ${n.rawLen} ft (${n.metersPerSheet.toFixed(3)} m) = ${n.totalLinearMeters.toFixed(2)} m -> ${y(n.rowSubtotal)}`):o.push(`${i+1}. ${n.qty} pcs x ${n.rawLen} m = ${n.totalLinearMeters.toFixed(2)} m -> ${y(n.rowSubtotal)}`)}),o.push(""),o.push(`Total Sheets: ${t.totalSheets} pcs (${t.totalMeters.toFixed(2)} linear meters)`),o.push(`Roofing Subtotal: ${y(t.roofingSubtotal)}`),o.push(`Delivery: ${t.delivery.fee===0?"FREE (PHP 0.00)":y(t.delivery.fee)} (${t.delivery.explanation})`),o.push(`ESTIMATED TOTAL: ${y(t.grandTotal)}`),e.customerName.trim()&&(o.push(""),o.push(`Customer: ${e.customerName.trim()}`)),e.customerContact.trim()&&o.push(`Contact: ${e.customerContact.trim()}`),e.customerAddress.trim()&&o.push(`Site Location: ${e.customerAddress.trim()}`),e.customerNotes.trim()&&o.push(`Notes: ${e.customerNotes.trim()}`),o.join(`
`)}function L(t,o=!1){const n=document.getElementById("quoteActionFeedback");n&&(n.textContent=t,n.classList.remove("hidden"),n.className=o?"rounded-xl p-3 bg-[#F9EBEC] border border-[#9E1B22]/30 caption-1 text-[#9E1B22]":"rounded-xl p-3 bg-[#E7F4EC] border border-[#1D6335]/30 caption-1 text-[#1D6335]")}function ee(){["errCustomerName","errCustomerContact","errCustomerAddress"].forEach(t=>{const o=document.getElementById(t);o&&(o.textContent="",o.classList.add("hidden"))})}function ue(){ee();let t=!0;if(!A().validRows.length)return L("Enter at least one sheet cut with a quantity and length greater than zero before sending your quote.",!0),!1;const n=e.customerName.trim(),i=e.customerContact.trim(),l=e.customerAddress.trim();if(!n){const r=document.getElementById("errCustomerName");r&&(r.textContent="Enter your name so our Taal sales desk can reference your quote.",r.classList.remove("hidden")),t=!1}if(i){if(i.includes("@")){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i)){const d=document.getElementById("errCustomerContact");d&&(d.textContent="Enter a valid email format such as name@domain.com, or enter your 11 digit mobile number.",d.classList.remove("hidden")),t=!1}}else if(i.replace(/\D/g,"").length<10){const d=document.getElementById("errCustomerContact");d&&(d.textContent="Enter at least 10 digits for your mobile or landline number.",d.classList.remove("hidden")),t=!1}}else{const r=document.getElementById("errCustomerContact");r&&(r.textContent="Enter a mobile number or email address so we can reply with fabrication availability.",r.classList.remove("hidden")),t=!1}if(e.deliveryMode==="delivery"&&!l){const r=document.getElementById("errCustomerAddress");r&&(r.textContent="Enter your delivery barangay and town so we can verify road distance from Taal.",r.classList.remove("hidden")),t=!1}return t||L("Complete the highlighted contact details above to send your quote via SMS.",!0),t}function v(){ae(),le(),de(),ce(),S(),C(),M&&(M.setProfile(e.profileId),M.setColor(e.colorId))}function me(){ie();const t=document.getElementById("quote3DMount"),o=document.getElementById("quote3DSkeleton");if(t)try{M=oe(t,{profile:e.profileId,colorId:e.colorId,autoRotate:!0}),o&&o.classList.add("hidden")}catch{o&&(o.innerHTML='<span class="caption-2 text-[#4A4A48] px-4 text-center">3D preview unavailable on this device</span>',o.classList.remove("skeleton-pulse"))}const n=document.getElementById("mobileMenuBtn"),i=document.getElementById("mobileMenuDrawer");n&&i&&n.addEventListener("click",()=>{const s=n.getAttribute("aria-expanded")!=="true";n.setAttribute("aria-expanded",String(s)),i.classList.toggle("is-open",s),i.setAttribute("aria-hidden",String(!s)),document.body.style.overflow=s?"hidden":""});const l=document.getElementById("navPillTrack"),r=document.getElementById("navHoverIndicator");l&&r&&(l.querySelectorAll(".nav-pill-link").forEach(a=>{a.addEventListener("mouseenter",()=>{const u=a.offsetLeft,f=a.offsetWidth;f<=0||(r.style.width=`${f}px`,r.style.transform=`translate3d(${u}px, 0, 0)`,r.style.opacity="1")})}),l.addEventListener("mouseleave",()=>{r.style.opacity="0"}));const d=document.getElementById("quoteTierCards");d&&d.addEventListener("click",s=>{const a=s.target.closest("[data-tier-card]");a&&(e.tierId=a.getAttribute("data-tier-card"),v())});const m=document.getElementById("quoteProfileButtons");m&&m.addEventListener("click",s=>{const a=s.target.closest("[data-quote-profile]");a&&(e.profileId=a.getAttribute("data-quote-profile"),v())});const b=document.getElementById("quoteColorSwatches");b&&b.addEventListener("click",s=>{const a=s.target.closest("[data-quote-color]");a&&(e.colorId=a.getAttribute("data-quote-color"),v())});const x=document.getElementById("unitBtnMeters"),h=document.getElementById("unitBtnFeet");function w(s){e.unit!==s&&(e.rows=e.rows.map(a=>{const u=Number(a.length)||0;if(u<=0)return a;const f=s==="ft"?+(u*k).toFixed(2):+(u*P).toFixed(2);return{...a,length:f}}),e.unit=s,v())}x&&x.addEventListener("click",()=>w("m")),h&&h.addEventListener("click",()=>w("ft"));const c=document.getElementById("lengthPresetChips");c&&c.addEventListener("click",s=>{const a=s.target.closest("[data-length-preset]");if(!a)return;const u=Number(a.getAttribute("data-length-preset"));u&&(e.rows.length?e.rows[e.rows.length-1].length=u:e.rows.push({id:F++,qty:10,length:u}),v())});const p=document.getElementById("sheetCutRowsMount");p&&(p.addEventListener("input",s=>{const a=s.target.getAttribute("data-row-qty"),u=s.target.getAttribute("data-row-len");if(a){const f=e.rows.find(T=>String(T.id)===a);f&&(f.qty=s.target.value,V(),C())}else if(u){const f=e.rows.find(T=>String(T.id)===u);f&&(f.length=s.target.value,V(),C())}}),p.addEventListener("click",s=>{const a=s.target.closest("[data-remove-row]");if(!a)return;const u=Number(a.getAttribute("data-remove-row"));e.rows=e.rows.filter(f=>f.id!==u),v()}));const B=document.getElementById("addSheetCutRowBtn");B&&B.addEventListener("click",()=>{e.rows.push({id:F++,qty:8,length:e.unit==="m"?3.5:10}),v()});const g=document.getElementById("modeBtnDelivery"),$=document.getElementById("modeBtnPickup"),I=document.getElementById("distanceKmInput"),te=document.querySelectorAll("[data-km-preset]");g&&g.addEventListener("click",()=>{e.deliveryMode="delivery",S(),C()}),$&&$.addEventListener("click",()=>{e.deliveryMode="pickup",ee(),S(),C()}),I&&I.addEventListener("input",s=>{e.distanceKm=Math.max(0,Number(s.target.value)||0),S(),C()}),te.forEach(s=>{s.addEventListener("click",()=>{const a=Number(s.getAttribute("data-km-preset"));e.deliveryMode="delivery",e.distanceKm=a,I&&(I.value=a),S(),C()})});const R=document.getElementById("customerNameInput"),N=document.getElementById("customerContactInput"),D=document.getElementById("customerAddressInput"),O=document.getElementById("customerNotesInput");R&&R.addEventListener("input",s=>{e.customerName=s.target.value}),N&&N.addEventListener("input",s=>{e.customerContact=s.target.value}),D&&D.addEventListener("input",s=>{e.customerAddress=s.target.value}),O&&O.addEventListener("input",s=>{e.customerNotes=s.target.value});const H=document.getElementById("sendQuoteSmsBtn"),j=document.getElementById("copyQuoteBtn"),Q=document.getElementById("printQuoteBtn");H&&H.addEventListener("click",()=>{if(!ue())return;const s=z();L("Opening your messaging app addressed to 0918 408 0396 with your itemized quote."),window.location.href=`sms:09184080396?body=${encodeURIComponent(s)}`}),j&&j.addEventListener("click",async()=>{if(!A().validRows.length){L("Add at least one valid sheet cut row before copying your quote breakdown.",!0);return}const a=z();try{await navigator.clipboard.writeText(a),L("Quote breakdown copied to your clipboard. You can paste it into SMS, Viber, or Messenger.")}catch{L("Clipboard access is blocked by this browser. Use Print or Save PDF below instead.",!0)}}),Q&&Q.addEventListener("click",()=>{window.print()});const E=document.getElementById("legalModal"),_=document.getElementById("legalModalTitle"),U=document.getElementById("legalModalBody"),K=document.getElementById("closeLegalModal"),ne=document.querySelectorAll("[data-legal-open]");if(E&&_&&U){const s={privacy:{title:"Privacy policy",html:'<p class="body-3 text-[#4A4A48]">CAB Steel Metal Fabrication uses the contact and roofing cut details entered on this quote calculator solely to verify coil stock, compute custom sheet fabrication pricing, and arrange pickup or site delivery from Brgy Halang, Bypass Rd. Taal, Batangas.</p><p class="body-3 text-[#4A4A48] mt-4">All calculations run directly in your browser until you choose to send your quote via SMS or phone to 0918 408 0396.</p>'},terms:{title:"Terms of quotation and fabrication",html:'<p class="body-3 text-[#4A4A48]">Per linear meter rates follow the official CAB Steel brochure: Premium (₱455 Long Span / ₱525 Tile Span), Original (₱370 Long Span / ₱440 Tile Span), and Economy (₱270 Long Span / ₱340 Tile Span). Measurements entered in feet convert at 1 foot equals 0.3048 meters.</p><p class="body-3 text-[#4A4A48] mt-4">Delivery within 3 km of CAB Steel in Taal, Batangas is free. Distances exceeding 3 km are billed at ₱150 per excess kilometer.</p>'}};ne.forEach(a=>{a.addEventListener("click",()=>{const u=a.getAttribute("data-legal-open"),f=s[u]||s.privacy;_.textContent=f.title,U.innerHTML=f.html,typeof E.showModal=="function"&&E.showModal()})}),K&&K.addEventListener("click",()=>{typeof E.close=="function"&&E.close()}),E.addEventListener("click",a=>{a.target===E&&typeof E.close=="function"&&E.close()})}v()}document.addEventListener("DOMContentLoaded",me);
