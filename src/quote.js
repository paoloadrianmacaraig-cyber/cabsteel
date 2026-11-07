import { createRoof3DViewer } from './roof3d.js';
import {
  FEET_TO_METERS,
  METERS_TO_FEET,
  FREE_DELIVERY_KM,
  DELIVERY_RATE_PER_KM,
  PRODUCT_TIERS,
  ROOF_PROFILES,
  ROOF_COLORS,
  getTierById,
  getProfileById,
  getColorById,
  convertToMeters,
  calculateDeliveryFee,
  formatPHP,
} from './data/products.js';

// ============================================================================
// QUOTE CONFIGURATOR STATE
// ============================================================================
let nextRowId = 3;

const state = {
  tierId: 'premium',
  profileId: 'longspan',
  colorId: 'red',
  unit: 'm', // 'm' or 'ft'
  rows: [
    { id: 1, qty: 12, length: 4 },
  ],
  deliveryMode: 'delivery', // 'delivery' or 'pickup'
  distanceKm: 3,
  customerName: '',
  customerContact: '',
  customerAddress: '',
  customerNotes: '',
};

let viewer3D = null;

function parseInitialQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const tier = params.get('tier');
  const profile = params.get('profile');
  const color = params.get('color');

  if (tier && PRODUCT_TIERS.some((t) => t.id === tier)) {
    state.tierId = tier;
  }
  if (profile && ROOF_PROFILES.some((p) => p.id === profile)) {
    state.profileId = profile;
  }
  if (color && ROOF_COLORS.some((c) => c.id === color)) {
    state.colorId = color;
  }
}

function getCurrentPricePerMeter() {
  const tier = getTierById(state.tierId);
  return tier.prices[state.profileId] || tier.prices.longspan;
}

function computeQuoteTotals() {
  const tier = getTierById(state.tierId);
  const profile = getProfileById(state.profileId);
  const color = getColorById(state.colorId);
  const pricePerMeter = getCurrentPricePerMeter();
  const effectivePricePerFoot = +(pricePerMeter * FEET_TO_METERS).toFixed(2);

  const computedRows = state.rows.map((row) => {
    const qty = Math.max(0, Math.floor(Number(row.qty) || 0));
    const rawLen = Math.max(0, Number(row.length) || 0);
    const metersPerSheet = convertToMeters(rawLen, state.unit);
    const totalLinearMeters = qty * metersPerSheet;
    const rowSubtotal = +(totalLinearMeters * pricePerMeter).toFixed(2);
    return {
      ...row,
      qty,
      rawLen,
      metersPerSheet,
      totalLinearMeters,
      rowSubtotal,
    };
  });

  const validRows = computedRows.filter((r) => r.qty > 0 && r.rawLen > 0);
  const totalSheets = validRows.reduce((acc, r) => acc + r.qty, 0);
  const totalMeters = validRows.reduce((acc, r) => acc + r.totalLinearMeters, 0);
  const roofingSubtotal = validRows.reduce((acc, r) => acc + r.rowSubtotal, 0);

  const delivery = calculateDeliveryFee(state.deliveryMode, state.distanceKm);
  const grandTotal = +(roofingSubtotal + delivery.fee).toFixed(2);

  return {
    tier,
    profile,
    color,
    pricePerMeter,
    effectivePricePerFoot,
    computedRows,
    validRows,
    totalSheets,
    totalMeters,
    roofingSubtotal,
    delivery,
    grandTotal,
  };
}

// ============================================================================
// UI RENDERERS
// ============================================================================
function renderTierCards() {
  const mount = document.getElementById('quoteTierCards');
  if (!mount) return;

  mount.innerHTML = PRODUCT_TIERS.map((tier) => {
    const isSelected = tier.id === state.tierId;
    const activePrice = tier.prices[state.profileId];
    return `
      <button
        type="button"
        role="radio"
        aria-checked="${isSelected}"
        data-tier-card="${tier.id}"
        class="btn-interactive text-left rounded-2xl p-4 sm:p-6 border ${
          isSelected
            ? 'bg-[#F9EBEC] border-2 border-[#9E1B22]'
            : 'bg-white border-black/10 hover:border-black/25'
        } flex flex-col justify-between gap-4 cursor-pointer"
      >
        <div class="flex flex-col gap-2 w-full">
          <div class="flex items-center justify-between gap-2">
            <span class="caption-3 font-mono-num ${isSelected ? 'text-[#9E1B22]' : 'text-[#6E6E6A]'}">
              ${tier.number} · ${tier.thickness}
            </span>
            <span class="py-0.5 px-2 rounded-full ${
              isSelected ? 'bg-[#9E1B22] text-white' : 'bg-[#F4F3F1] text-[#4A4A48]'
            } caption-3">
              ${isSelected ? 'Selected' : 'Select'}
            </span>
          </div>

          <span class="heading-6 text-[#181818]">${tier.name}</span>
          <span class="caption-2 text-[#4A4A48]">${tier.tagline}</span>
        </div>

        <div class="w-full rounded-xl p-3 bg-white border border-black/10 flex flex-col gap-2">
          <div class="flex items-baseline justify-between gap-2">
            <span class="caption-1 ${state.profileId === 'longspan' ? 'text-[#181818]' : 'text-[#6E6E6A]'}">
              Long Span (8 Ribs)
            </span>
            <span class="body-4 font-mono-num ${
              state.profileId === 'longspan' && isSelected ? 'text-[#9E1B22]' : 'text-[#181818]'
            }">
              ₱${tier.prices.longspan} / m
            </span>
          </div>
          <div class="h-px w-full bg-black/10"></div>
          <div class="flex items-baseline justify-between gap-2">
            <span class="caption-1 ${state.profileId === 'tilespan' ? 'text-[#181818]' : 'text-[#6E6E6A]'}">
              Tile Span Roofing
            </span>
            <span class="body-4 font-mono-num ${
              state.profileId === 'tilespan' && isSelected ? 'text-[#9E1B22]' : 'text-[#181818]'
            }">
              ₱${tier.prices.tilespan} / m
            </span>
          </div>
        </div>
      </button>
    `;
  }).join('');
}

function renderProfileAndColorControls() {
  const tier = getTierById(state.tierId);
  const profileMount = document.getElementById('quoteProfileButtons');
  const swatchMount = document.getElementById('quoteColorSwatches');
  const colorLabel = document.getElementById('quoteSelectedColorLabel');

  if (profileMount) {
    profileMount.innerHTML = ROOF_PROFILES.map((prof) => {
      const isSelected = prof.id === state.profileId;
      const rate = tier.prices[prof.id];
      return `
        <button
          type="button"
          role="radio"
          aria-checked="${isSelected}"
          data-quote-profile="${prof.id}"
          class="btn-interactive rounded-xl p-4 text-left border ${
            isSelected
              ? 'bg-[#F9EBEC] border-2 border-[#9E1B22]'
              : 'bg-white border-black/10 hover:border-black/25'
          } flex flex-col gap-2 cursor-pointer"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="title-2 text-[#181818]">${prof.shortName}</span>
            <span class="heading-6 font-mono-num ${isSelected ? 'text-[#9E1B22]' : 'text-[#181818]'}">
              ₱${rate} <span class="caption-2 text-[#6E6E6A]">/ m</span>
            </span>
          </div>
          <p class="caption-2 text-[#4A4A48]">${prof.summary}</p>
        </button>
      `;
    }).join('');
  }

  const activeCol = getColorById(state.colorId);
  if (colorLabel) {
    colorLabel.textContent = `${activeCol.name} (${activeCol.hex})`;
  }

  if (swatchMount) {
    swatchMount.innerHTML = ROOF_COLORS.map(
      (col) => `
      <button
        type="button"
        role="radio"
        aria-checked="${col.id === state.colorId}"
        aria-label="${col.name}"
        data-quote-color="${col.id}"
        class="color-swatch-btn flex items-center gap-2 py-2 px-3 rounded-xl border ${
          col.id === state.colorId
            ? 'bg-white border-2 border-[#181818]'
            : 'bg-white border-black/10 hover:border-black/25'
        } cursor-pointer"
      >
        <span
          class="w-5 h-5 rounded-full border border-black/15 shrink-0"
          style="background-color: ${col.hex};"
        ></span>
        <span class="caption-1 text-[#181818]">${col.name}</span>
      </button>
    `
    ).join('');
  }
}

function renderUnitControlsAndPresets() {
  const btnMeters = document.getElementById('unitBtnMeters');
  const btnFeet = document.getElementById('unitBtnFeet');
  const unitNote = document.getElementById('unitConversionHelper');
  const presetsMount = document.getElementById('lengthPresetChips');

  const isMeters = state.unit === 'm';
  const ratePerM = getCurrentPricePerMeter();
  const ratePerFt = (ratePerM * FEET_TO_METERS).toFixed(2);

  if (btnMeters && btnFeet) {
    btnMeters.setAttribute('aria-pressed', String(isMeters));
    btnFeet.setAttribute('aria-pressed', String(!isMeters));

    btnMeters.className = isMeters
      ? 'btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer'
      : 'btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm cursor-pointer';

    btnFeet.className = !isMeters
      ? 'btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer'
      : 'btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm cursor-pointer';
  }

  if (unitNote) {
    unitNote.textContent = isMeters
      ? `Active rate: ₱${ratePerM} per linear meter (1 m = 3.2808 ft)`
      : `Active rate: ₱${ratePerM} per linear meter · Exact conversion: 1 ft = 0.3048 m (≈ ₱${ratePerFt} per linear foot)`;
  }

  if (presetsMount) {
    const presets = isMeters ? [2.5, 3, 3.6, 4, 5, 6] : [8, 10, 12, 14, 16, 20];
    presetsMount.innerHTML = presets
      .map(
        (val) => `
        <button
          type="button"
          data-length-preset="${val}"
          class="btn-interactive py-1 px-3 rounded-lg bg-white border border-black/10 hover:border-black/30 caption-3 font-mono-num text-[#181818] cursor-pointer"
        >
          ${val} ${state.unit}
        </button>
      `
      )
      .join('');
  }
}

function renderSheetRows() {
  const mount = document.getElementById('sheetCutRowsMount');
  if (!mount) return;

  if (!state.rows.length) {
    mount.innerHTML = `
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
    `;
    const restoreBtn = document.getElementById('restoreSampleRowBtn');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        state.rows.push({
          id: nextRowId++,
          qty: 10,
          length: state.unit === 'm' ? 4 : 12,
        });
        updateAll();
      });
    }
    return;
  }

  const totals = computeQuoteTotals();

  mount.innerHTML = totals.computedRows
    .map((row, index) => {
      const conversionDetail =
        state.unit === 'ft'
          ? `${row.rawLen || 0} ft = ${row.metersPerSheet.toFixed(3)} m per sheet · ${row.totalLinearMeters.toFixed(2)} m total`
          : `${row.totalLinearMeters.toFixed(2)} linear meters total (${(row.totalLinearMeters * METERS_TO_FEET).toFixed(1)} ft)`;

      return `
        <div class="rounded-2xl p-4 bg-white border border-black/10 flex flex-col gap-3" data-row-id="${row.id}">
          <div class="flex items-center justify-between gap-2">
            <span class="caption-3 uppercase tracking-wider text-[#6E6E6A]">
              Sheet cut #${index + 1}
            </span>
            ${
              state.rows.length > 1
                ? `<button
                    type="button"
                    data-remove-row="${row.id}"
                    class="caption-3 text-[#9E1B22] hover:underline cursor-pointer"
                  >
                    Remove cut
                  </button>`
                : ''
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div class="sm:col-span-4 flex flex-col gap-1">
              <label for="qtyInput_${row.id}" class="caption-1 text-[#4A4A48]">
                Quantity (sheets)
              </label>
              <input
                id="qtyInput_${row.id}"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-row-qty="${row.id}"
                value="${row.qty}"
                class="w-full py-2 px-3 rounded-lg bg-[#F4F3F1] border border-black/15 font-mono-num body-2 text-[#181818]"
              />
            </div>

            <div class="sm:col-span-5 flex flex-col gap-1">
              <label for="lenInput_${row.id}" class="caption-1 text-[#4A4A48]">
                Length per sheet (${state.unit === 'm' ? 'meters' : 'feet'})
              </label>
              <div class="relative flex items-center">
                <input
                  id="lenInput_${row.id}"
                  type="number"
                  min="0.1"
                  step="0.1"
                  inputmode="decimal"
                  data-row-len="${row.id}"
                  value="${row.length}"
                  class="w-full py-2 pl-3 pr-12 rounded-lg bg-[#F4F3F1] border border-black/15 font-mono-num body-2 text-[#181818]"
                />
                <span class="absolute right-3 caption-3 font-mono-num text-[#6E6E6A] pointer-events-none">
                  ${state.unit}
                </span>
              </div>
            </div>

            <div class="sm:col-span-3 flex flex-col sm:items-end justify-end">
              <span class="caption-4 text-[#6E6E6A]">Row cost</span>
              <span class="title-2 font-mono-num text-[#181818]" data-row-subtotal="${row.id}">
                ${formatPHP(row.rowSubtotal)}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 pt-1">
            <span class="caption-4 font-mono-num text-[#6E6E6A]" data-row-meta="${row.id}">
              ${conversionDetail}
            </span>
          </div>
        </div>
      `;
    })
    .join('');
}

function updateRowCalculatedReadoutsOnly() {
  const totals = computeQuoteTotals();
  totals.computedRows.forEach((row) => {
    const subEl = document.querySelector(`[data-row-subtotal="${row.id}"]`);
    const metaEl = document.querySelector(`[data-row-meta="${row.id}"]`);
    if (subEl) {
      subEl.textContent = formatPHP(row.rowSubtotal);
    }
    if (metaEl) {
      metaEl.textContent =
        state.unit === 'ft'
          ? `${row.rawLen || 0} ft = ${row.metersPerSheet.toFixed(3)} m per sheet · ${row.totalLinearMeters.toFixed(2)} m total`
          : `${row.totalLinearMeters.toFixed(2)} linear meters total (${(row.totalLinearMeters * METERS_TO_FEET).toFixed(1)} ft)`;
    }
  });
}

function renderDeliveryUI() {
  const btnDelivery = document.getElementById('modeBtnDelivery');
  const btnPickup = document.getElementById('modeBtnPickup');
  const distancePanel = document.getElementById('deliveryDistancePanel');
  const distanceInput = document.getElementById('distanceKmInput');
  const deliveryStatusBadge = document.getElementById('deliveryStatusBadge');
  const deliveryFormulaText = document.getElementById('deliveryFormulaText');

  const isDelivery = state.deliveryMode === 'delivery';

  if (btnDelivery && btnPickup) {
    btnDelivery.setAttribute('aria-pressed', String(isDelivery));
    btnPickup.setAttribute('aria-pressed', String(!isDelivery));

    btnDelivery.className = isDelivery
      ? 'btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer'
      : 'btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm cursor-pointer';

    btnPickup.className = !isDelivery
      ? 'btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm cursor-pointer'
      : 'btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm cursor-pointer';
  }

  if (distancePanel) {
    distancePanel.classList.toggle('hidden', !isDelivery);
  }

  if (distanceInput && document.activeElement !== distanceInput) {
    distanceInput.value = state.distanceKm;
  }

  const deliveryInfo = calculateDeliveryFee(state.deliveryMode, state.distanceKm);
  if (deliveryStatusBadge) {
    if (deliveryInfo.fee === 0) {
      deliveryStatusBadge.textContent = 'FREE (₱0.00)';
      deliveryStatusBadge.className =
        'py-1 px-3 rounded-full bg-[#E7F4EC] text-[#1D6335] caption-3 font-mono-num';
    } else {
      deliveryStatusBadge.textContent = formatPHP(deliveryInfo.fee);
      deliveryStatusBadge.className =
        'py-1 px-3 rounded-full bg-[#F9EBEC] text-[#9E1B22] caption-3 font-mono-num';
    }
  }

  if (deliveryFormulaText) {
    deliveryFormulaText.textContent = deliveryInfo.explanation;
  }
}

function renderSummaryCard() {
  const totals = computeQuoteTotals();

  const tierEl = document.getElementById('summaryTierName');
  const profileEl = document.getElementById('summaryProfileName');
  const colorEl = document.getElementById('summaryColorName');
  const colorDot = document.getElementById('summaryColorDot');
  const rateEl = document.getElementById('summaryRatePerMeter');
  const sheetsEl = document.getElementById('summaryTotalSheets');
  const metersEl = document.getElementById('summaryTotalMeters');
  const roofSubEl = document.getElementById('summaryRoofSubtotal');
  const delivFeeEl = document.getElementById('summaryDeliveryFee');
  const delivNoteEl = document.getElementById('summaryDeliveryNote');
  const grandTotalEl = document.getElementById('summaryGrandTotal');
  const cutBreakdownEl = document.getElementById('summaryCutBreakdown');
  const badge3DEl = document.getElementById('quote3DBadge');

  if (tierEl) tierEl.textContent = `${totals.tier.name} (${totals.tier.thickness})`;
  if (profileEl) profileEl.textContent = totals.profile.shortName;
  if (colorEl) colorEl.textContent = totals.color.name;
  if (colorDot) colorDot.style.backgroundColor = totals.color.hex;
  if (rateEl) rateEl.textContent = `₱${totals.pricePerMeter} / m`;
  if (sheetsEl) sheetsEl.textContent = `${totals.totalSheets} pcs`;
  if (metersEl) {
    metersEl.textContent = `${totals.totalMeters.toFixed(2)} m (${(
      totals.totalMeters * METERS_TO_FEET
    ).toFixed(1)} ft)`;
  }
  if (roofSubEl) roofSubEl.textContent = formatPHP(totals.roofingSubtotal);
  if (delivFeeEl) {
    delivFeeEl.textContent = totals.delivery.fee === 0 ? 'FREE (₱0.00)' : formatPHP(totals.delivery.fee);
  }
  if (delivNoteEl) delivNoteEl.textContent = totals.delivery.explanation;
  if (grandTotalEl) grandTotalEl.textContent = formatPHP(totals.grandTotal);
  if (badge3DEl) {
    badge3DEl.textContent = `${totals.profile.shortName} · ${totals.color.name}`;
  }

  if (cutBreakdownEl) {
    if (!totals.validRows.length) {
      cutBreakdownEl.innerHTML =
        '<p class="caption-2 text-[#6E6E6A]">Enter at least one valid sheet quantity and length to see itemized line totals.</p>';
    } else {
      cutBreakdownEl.innerHTML = totals.validRows
        .map((r, i) => {
          const dimText =
            state.unit === 'ft'
              ? `${r.qty} pcs × ${r.rawLen} ft (${r.metersPerSheet.toFixed(2)} m)`
              : `${r.qty} pcs × ${r.rawLen} m`;
          return `
            ${i > 0 ? '<div class="h-px w-full bg-black/10"></div>' : ''}
            <div class="py-2 flex items-center justify-between gap-2">
              <span class="caption-2 font-mono-num text-[#4A4A48]">${dimText}</span>
              <span class="caption-1 font-mono-num text-[#181818]">${formatPHP(r.rowSubtotal)}</span>
            </div>
          `;
        })
        .join('');
    }
  }

  // Also update Print Header Timestamp
  const printDateEl = document.getElementById('printQuoteDate');
  if (printDateEl) {
    printDateEl.textContent = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

function buildPlainTextQuoteSummary() {
  const totals = computeQuoteTotals();
  const lines = [
    'CAB STEEL METAL FABRICATION — QUOTE REQUEST',
    `Product Tier: ${totals.tier.name} (${totals.tier.thickness})`,
    `Roofing Profile: ${totals.profile.name}`,
    `Color: ${totals.color.name}`,
    `Rate: PHP ${totals.pricePerMeter} / linear meter`,
    '',
    'CUSTOM CUTTING LIST:',
  ];

  totals.validRows.forEach((r, idx) => {
    if (state.unit === 'ft') {
      lines.push(
        `${idx + 1}. ${r.qty} pcs x ${r.rawLen} ft (${r.metersPerSheet.toFixed(3)} m) = ${r.totalLinearMeters.toFixed(2)} m -> ${formatPHP(r.rowSubtotal)}`
      );
    } else {
      lines.push(
        `${idx + 1}. ${r.qty} pcs x ${r.rawLen} m = ${r.totalLinearMeters.toFixed(2)} m -> ${formatPHP(r.rowSubtotal)}`
      );
    }
  });

  lines.push('');
  lines.push(`Total Sheets: ${totals.totalSheets} pcs (${totals.totalMeters.toFixed(2)} linear meters)`);
  lines.push(`Roofing Subtotal: ${formatPHP(totals.roofingSubtotal)}`);
  lines.push(
    `Delivery: ${totals.delivery.fee === 0 ? 'FREE (PHP 0.00)' : formatPHP(totals.delivery.fee)} (${totals.delivery.explanation})`
  );
  lines.push(`ESTIMATED TOTAL: ${formatPHP(totals.grandTotal)}`);

  if (state.customerName.trim()) {
    lines.push('');
    lines.push(`Customer: ${state.customerName.trim()}`);
  }
  if (state.customerContact.trim()) {
    lines.push(`Contact: ${state.customerContact.trim()}`);
  }
  if (state.customerAddress.trim()) {
    lines.push(`Site Location: ${state.customerAddress.trim()}`);
  }
  if (state.customerNotes.trim()) {
    lines.push(`Notes: ${state.customerNotes.trim()}`);
  }

  return lines.join('\n');
}

function showActionFeedback(message, isError = false) {
  const box = document.getElementById('quoteActionFeedback');
  if (!box) return;
  box.textContent = message;
  box.classList.remove('hidden');
  box.className = isError
    ? 'rounded-xl p-3 bg-[#F9EBEC] border border-[#9E1B22]/30 caption-1 text-[#9E1B22]'
    : 'rounded-xl p-3 bg-[#E7F4EC] border border-[#1D6335]/30 caption-1 text-[#1D6335]';
}

function clearFieldErrors() {
  ['errCustomerName', 'errCustomerContact', 'errCustomerAddress'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  });
}

function validateCustomerFormForSubmission() {
  clearFieldErrors();
  let valid = true;

  const totals = computeQuoteTotals();
  if (!totals.validRows.length) {
    showActionFeedback(
      'Enter at least one sheet cut with a quantity and length greater than zero before sending your quote.',
      true
    );
    return false;
  }

  const nameVal = state.customerName.trim();
  const contactVal = state.customerContact.trim();
  const addrVal = state.customerAddress.trim();

  if (!nameVal) {
    const el = document.getElementById('errCustomerName');
    if (el) {
      el.textContent = 'Enter your name so our Taal sales desk can reference your quote.';
      el.classList.remove('hidden');
    }
    valid = false;
  }

  if (!contactVal) {
    const el = document.getElementById('errCustomerContact');
    if (el) {
      el.textContent = 'Enter a mobile number or email address so we can reply with fabrication availability.';
      el.classList.remove('hidden');
    }
    valid = false;
  } else if (contactVal.includes('@')) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactVal);
    if (!emailOk) {
      const el = document.getElementById('errCustomerContact');
      if (el) {
        el.textContent = 'Enter a valid email format such as name@domain.com, or enter your 11 digit mobile number.';
        el.classList.remove('hidden');
      }
      valid = false;
    }
  } else {
    const digits = contactVal.replace(/\D/g, '');
    if (digits.length < 10) {
      const el = document.getElementById('errCustomerContact');
      if (el) {
        el.textContent = 'Enter at least 10 digits for your mobile or landline number.';
        el.classList.remove('hidden');
      }
      valid = false;
    }
  }

  if (state.deliveryMode === 'delivery' && !addrVal) {
    const el = document.getElementById('errCustomerAddress');
    if (el) {
      el.textContent = 'Enter your delivery barangay and town so we can verify road distance from Taal.';
      el.classList.remove('hidden');
    }
    valid = false;
  }

  if (!valid) {
    showActionFeedback('Complete the highlighted contact details above to send your quote via SMS.', true);
  }

  return valid;
}

function updateAll() {
  renderTierCards();
  renderProfileAndColorControls();
  renderUnitControlsAndPresets();
  renderSheetRows();
  renderDeliveryUI();
  renderSummaryCard();
  if (viewer3D) {
    viewer3D.setProfile(state.profileId);
    viewer3D.setColor(state.colorId);
  }
}

// ============================================================================
// EVENT WIRING & INITIALIZATION
// ============================================================================
function initQuotePage() {
  parseInitialQueryParams();

  // Initialize Compact Live 3D Roof Preview
  const stage3D = document.getElementById('quote3DMount');
  const skeleton3D = document.getElementById('quote3DSkeleton');
  if (stage3D) {
    try {
      viewer3D = createRoof3DViewer(stage3D, {
        profile: state.profileId,
        colorId: state.colorId,
        autoRotate: true,
      });
      if (skeleton3D) skeleton3D.classList.add('hidden');
    } catch (_e) {
      if (skeleton3D) {
        skeleton3D.innerHTML =
          '<span class="caption-2 text-[#4A4A48] px-4 text-center">3D preview unavailable on this device</span>';
        skeleton3D.classList.remove('skeleton-pulse');
      }
    }
  }

  // Mobile Menu Drawer & Smooth Nav Hover Follower (B7)
  const menuBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileMenuDrawer');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  const pillTrack = document.getElementById('navPillTrack');
  const hoverIndicator = document.getElementById('navHoverIndicator');
  if (pillTrack && hoverIndicator) {
    const links = pillTrack.querySelectorAll('.nav-pill-link');
    links.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        const x = link.offsetLeft;
        const w = link.offsetWidth;
        if (w <= 0) return;
        hoverIndicator.style.width = `${w}px`;
        hoverIndicator.style.transform = `translate3d(${x}px, 0, 0)`;
        hoverIndicator.style.opacity = '1';
      });
    });
    pillTrack.addEventListener('mouseleave', () => {
      hoverIndicator.style.opacity = '0';
    });
  }

  // Step 1: Tier selection
  const tierMount = document.getElementById('quoteTierCards');
  if (tierMount) {
    tierMount.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tier-card]');
      if (!btn) return;
      state.tierId = btn.getAttribute('data-tier-card');
      updateAll();
    });
  }

  // Step 2: Profile & Color selection
  const profileMount = document.getElementById('quoteProfileButtons');
  if (profileMount) {
    profileMount.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quote-profile]');
      if (!btn) return;
      state.profileId = btn.getAttribute('data-quote-profile');
      updateAll();
    });
  }

  const swatchMount = document.getElementById('quoteColorSwatches');
  if (swatchMount) {
    swatchMount.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quote-color]');
      if (!btn) return;
      state.colorId = btn.getAttribute('data-quote-color');
      updateAll();
    });
  }

  // Step 3: Unit toggle (Meters <-> Feet with automatic clean value conversion)
  const btnMeters = document.getElementById('unitBtnMeters');
  const btnFeet = document.getElementById('unitBtnFeet');

  function switchUnit(targetUnit) {
    if (state.unit === targetUnit) return;
    state.rows = state.rows.map((r) => {
      const num = Number(r.length) || 0;
      if (num <= 0) return r;
      const converted =
        targetUnit === 'ft'
          ? +(num * METERS_TO_FEET).toFixed(2)
          : +(num * FEET_TO_METERS).toFixed(2);
      return { ...r, length: converted };
    });
    state.unit = targetUnit;
    updateAll();
  }

  if (btnMeters) btnMeters.addEventListener('click', () => switchUnit('m'));
  if (btnFeet) btnFeet.addEventListener('click', () => switchUnit('ft'));

  // Quick preset length chips (applies to last row in the list)
  const presetsMount = document.getElementById('lengthPresetChips');
  if (presetsMount) {
    presetsMount.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-length-preset]');
      if (!btn) return;
      const presetVal = Number(btn.getAttribute('data-length-preset'));
      if (!presetVal) return;
      if (!state.rows.length) {
        state.rows.push({ id: nextRowId++, qty: 10, length: presetVal });
      } else {
        state.rows[state.rows.length - 1].length = presetVal;
      }
      updateAll();
    });
  }

  // Dynamic Cut Rows input & remove events
  const rowsMount = document.getElementById('sheetCutRowsMount');
  if (rowsMount) {
    rowsMount.addEventListener('input', (e) => {
      const qtyId = e.target.getAttribute('data-row-qty');
      const lenId = e.target.getAttribute('data-row-len');
      if (qtyId) {
        const targetRow = state.rows.find((r) => String(r.id) === qtyId);
        if (targetRow) {
          targetRow.qty = e.target.value;
          updateRowCalculatedReadoutsOnly();
          renderSummaryCard();
        }
      } else if (lenId) {
        const targetRow = state.rows.find((r) => String(r.id) === lenId);
        if (targetRow) {
          targetRow.length = e.target.value;
          updateRowCalculatedReadoutsOnly();
          renderSummaryCard();
        }
      }
    });

    rowsMount.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove-row]');
      if (!removeBtn) return;
      const idToRemove = Number(removeBtn.getAttribute('data-remove-row'));
      state.rows = state.rows.filter((r) => r.id !== idToRemove);
      updateAll();
    });
  }

  const addRowBtn = document.getElementById('addSheetCutRowBtn');
  if (addRowBtn) {
    addRowBtn.addEventListener('click', () => {
      state.rows.push({
        id: nextRowId++,
        qty: 8,
        length: state.unit === 'm' ? 3.5 : 10,
      });
      updateAll();
    });
  }

  // Step 4: Delivery Mode & Distance
  const btnDelivery = document.getElementById('modeBtnDelivery');
  const btnPickup = document.getElementById('modeBtnPickup');
  const distanceInput = document.getElementById('distanceKmInput');
  const distancePresets = document.querySelectorAll('[data-km-preset]');

  if (btnDelivery) {
    btnDelivery.addEventListener('click', () => {
      state.deliveryMode = 'delivery';
      renderDeliveryUI();
      renderSummaryCard();
    });
  }
  if (btnPickup) {
    btnPickup.addEventListener('click', () => {
      state.deliveryMode = 'pickup';
      clearFieldErrors();
      renderDeliveryUI();
      renderSummaryCard();
    });
  }
  if (distanceInput) {
    distanceInput.addEventListener('input', (e) => {
      state.distanceKm = Math.max(0, Number(e.target.value) || 0);
      renderDeliveryUI();
      renderSummaryCard();
    });
  }
  distancePresets.forEach((chip) => {
    chip.addEventListener('click', () => {
      const km = Number(chip.getAttribute('data-km-preset'));
      state.deliveryMode = 'delivery';
      state.distanceKm = km;
      if (distanceInput) distanceInput.value = km;
      renderDeliveryUI();
      renderSummaryCard();
    });
  });

  // Step 5: Customer fields
  const nameInput = document.getElementById('customerNameInput');
  const contactInput = document.getElementById('customerContactInput');
  const addressInput = document.getElementById('customerAddressInput');
  const notesInput = document.getElementById('customerNotesInput');

  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      state.customerName = e.target.value;
    });
  }
  if (contactInput) {
    contactInput.addEventListener('input', (e) => {
      state.customerContact = e.target.value;
    });
  }
  if (addressInput) {
    addressInput.addEventListener('input', (e) => {
      state.customerAddress = e.target.value;
    });
  }
  if (notesInput) {
    notesInput.addEventListener('input', (e) => {
      state.customerNotes = e.target.value;
    });
  }

  // Quote Actions: Send SMS, Copy Breakdown, Print PDF
  const sendSmsBtn = document.getElementById('sendQuoteSmsBtn');
  const copyQuoteBtn = document.getElementById('copyQuoteBtn');
  const printQuoteBtn = document.getElementById('printQuoteBtn');

  if (sendSmsBtn) {
    sendSmsBtn.addEventListener('click', () => {
      if (!validateCustomerFormForSubmission()) return;
      const body = buildPlainTextQuoteSummary();
      showActionFeedback('Opening your messaging app addressed to 0918 408 0396 with your itemized quote.');
      window.location.href = `sms:09184080396?body=${encodeURIComponent(body)}`;
    });
  }

  if (copyQuoteBtn) {
    copyQuoteBtn.addEventListener('click', async () => {
      const totals = computeQuoteTotals();
      if (!totals.validRows.length) {
        showActionFeedback('Add at least one valid sheet cut row before copying your quote breakdown.', true);
        return;
      }
      const text = buildPlainTextQuoteSummary();
      try {
        await navigator.clipboard.writeText(text);
        showActionFeedback('Quote breakdown copied to your clipboard. You can paste it into SMS, Viber, or Messenger.');
      } catch (_err) {
        showActionFeedback('Clipboard access is blocked by this browser. Use Print or Save PDF below instead.', true);
      }
    });
  }

  if (printQuoteBtn) {
    printQuoteBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Footer Legal Dialog Modal
  const legalModal = document.getElementById('legalModal');
  const legalTitle = document.getElementById('legalModalTitle');
  const legalBody = document.getElementById('legalModalBody');
  const closeLegalBtn = document.getElementById('closeLegalModal');
  const legalOpenBtns = document.querySelectorAll('[data-legal-open]');

  if (legalModal && legalTitle && legalBody) {
    const LEGAL_COPY = {
      privacy: {
        title: 'Privacy policy',
        html: '<p class="body-3 text-[#4A4A48]">CAB Steel Metal Fabrication uses the contact and roofing cut details entered on this quote calculator solely to verify coil stock, compute custom sheet fabrication pricing, and arrange pickup or site delivery from Brgy Halang, Bypass Rd. Taal, Batangas.</p><p class="body-3 text-[#4A4A48] mt-4">All calculations run directly in your browser until you choose to send your quote via SMS or phone to 0918 408 0396.</p>',
      },
      terms: {
        title: 'Terms of quotation and fabrication',
        html: '<p class="body-3 text-[#4A4A48]">Per linear meter rates follow the official CAB Steel brochure: Premium (₱455 Long Span / ₱525 Tile Span), Original (₱370 Long Span / ₱440 Tile Span), and Economy (₱270 Long Span / ₱340 Tile Span). Measurements entered in feet convert at 1 foot equals 0.3048 meters.</p><p class="body-3 text-[#4A4A48] mt-4">Delivery within 3 km of CAB Steel in Taal, Batangas is free. Distances exceeding 3 km are billed at ₱150 per excess kilometer.</p>',
      },
    };

    legalOpenBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-legal-open');
        const entry = LEGAL_COPY[key] || LEGAL_COPY.privacy;
        legalTitle.textContent = entry.title;
        legalBody.innerHTML = entry.html;
        if (typeof legalModal.showModal === 'function') legalModal.showModal();
      });
    });

    if (closeLegalBtn) {
      closeLegalBtn.addEventListener('click', () => {
        if (typeof legalModal.close === 'function') legalModal.close();
      });
    }
    legalModal.addEventListener('click', (e) => {
      if (e.target === legalModal && typeof legalModal.close === 'function') legalModal.close();
    });
  }

  updateAll();
}

document.addEventListener('DOMContentLoaded', initQuotePage);
