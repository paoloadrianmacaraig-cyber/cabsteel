// Single source of truth from the official CAB STEEL Metal Fabrication brochure

export const FEET_TO_METERS = 0.3048;
export const METERS_TO_FEET = 1 / 0.3048;
export const FREE_DELIVERY_KM = 3;
export const DELIVERY_RATE_PER_KM = 150;

export const PRODUCT_TIERS = [
  {
    id: 'premium',
    number: '01',
    name: 'CAB Steel Premium',
    badge: 'Genuine APO Galfan · Puyat Steel',
    featured: true,
    tagline: 'Premium protection. Premium material.',
    thickness: '0.5 mm',
    coating: '95% zinc and 5% aluminum APO Galfan coating',
    description:
      'Premium protection that lasts. Fabricated from 0.5 mm Genuine APO Galfan coil by Puyat Steel Corporation, engineered with a 95% zinc and 5% aluminum coating for superior corrosion resistance and service life.',
    idealFor:
      'Homes, commercial buildings, warehouses, and projects where long term durability and corrosion protection are a priority.',
    prices: {
      longspan: 455,
      tilespan: 525,
    },
  },
  {
    id: 'original',
    number: '02',
    name: 'CAB Steel Original',
    badge: 'Balanced 0.5 mm Value',
    featured: false,
    tagline: 'Reliable 0.5 mm quality. Better value.',
    thickness: '0.5 mm',
    coating: 'Prepainted galvanized steel coil',
    description:
      'Offers full 0.5 mm steel thickness for customers seeking a strong, durable roofing sheet at a more accessible price. Delivers a practical balance of structural strength, finish quality, and everyday value.',
    idealFor:
      'Homes, renovations, and commercial spaces looking for durable 0.5 mm roofing at an accessible price.',
    prices: {
      longspan: 370,
      tilespan: 440,
    },
  },
  {
    id: 'economy',
    number: '03',
    name: 'CAB Steel Economy',
    badge: 'Practical 0.4 mm Gauge',
    featured: false,
    tagline: 'Practical roofing. Budget smart choice.',
    thickness: '0.4 mm',
    coating: 'Prepainted standard steel coil',
    description:
      'At 0.4 mm thickness, CAB Steel Economy is built for customers who prioritize upfront affordability and dependable everyday coverage.',
    idealFor:
      'Budget conscious projects, storage sheds, home extensions, carports, and light duty structures.',
    prices: {
      longspan: 270,
      tilespan: 340,
    },
  },
];

export const ROOF_PROFILES = [
  {
    id: 'longspan',
    name: 'Long Span Roofing (8 Ribs)',
    shortName: 'Long Span (8 Ribs)',
    summary:
      'Lightweight, high strength metal roofing panel designed for wide coverage and fast installation. Built for structures that require durable, low maintenance protection.',
    specs: [
      { label: 'Rib geometry', value: '8 trapezoidal major ribs with valley stiffening flutes' },
      { label: 'Thickness options', value: '0.5 mm (Premium & Original) · 0.4 mm (Economy)' },
      { label: 'Cutting', value: 'Custom length fabrication to match your roof slope' },
      { label: 'Price range', value: '₱270 to ₱455 per linear meter' },
    ],
  },
  {
    id: 'tilespan',
    name: 'Tile Span Roofing',
    shortName: 'Tile Span',
    summary:
      'Mimics the classic look of traditional clay tiles with the strength, lightness, and weather resistance of roll formed steel. Delivers an architectural appearance without heavy roof loads.',
    specs: [
      { label: 'Tile geometry', value: 'Scalloped barrel waves with stamped horizontal tile steps' },
      { label: 'Thickness options', value: '0.5 mm (Premium & Original) · 0.4 mm (Economy)' },
      { label: 'Cutting', value: 'Custom length fabrication to match your roof slope' },
      { label: 'Price range', value: '₱340 to ₱525 per linear meter' },
    ],
  },
];

// The 5 official colors shown under "Colors Available" on the brochure
export const ROOF_COLORS = [
  {
    id: 'red',
    name: 'Crimson Red',
    hex: '#9E2227',
    threeHex: 0x9e2227,
    ringHex: '#7A161A',
  },
  {
    id: 'green',
    name: 'Forest Green',
    hex: '#265834',
    threeHex: 0x265834,
    ringHex: '#1A3F25',
  },
  {
    id: 'brown',
    name: 'Terra Brown',
    hex: '#4E3124',
    threeHex: 0x4e3124,
    ringHex: '#362118',
  },
  {
    id: 'gray',
    name: 'Slate Gray',
    hex: '#7A7D80',
    threeHex: 0x7a7d80,
    ringHex: '#595C5E',
  },
  {
    id: 'blue',
    name: 'Royal Blue',
    hex: '#173E86',
    threeHex: 0x173e86,
    ringHex: '#0F2A5E',
  },
];

export function getTierById(id) {
  return PRODUCT_TIERS.find((t) => t.id === id) || PRODUCT_TIERS[0];
}

export function getProfileById(id) {
  return ROOF_PROFILES.find((p) => p.id === id) || ROOF_PROFILES[0];
}

export function getColorById(id) {
  return ROOF_COLORS.find((c) => c.id === id) || ROOF_COLORS[0];
}

export function convertToMeters(lengthValue, unit) {
  const val = Number(lengthValue) || 0;
  if (val <= 0) return 0;
  return unit === 'ft' ? val * FEET_TO_METERS : val;
}

export function calculateDeliveryFee(mode, distanceKm) {
  if (mode === 'pickup') {
    return {
      fee: 0,
      billableKm: 0,
      isFreeRadius: true,
      explanation: 'Plant pickup in Brgy Halang, Taal, Batangas (₱0)',
    };
  }
  const km = Math.max(0, Number(distanceKm) || 0);
  if (km <= FREE_DELIVERY_KM) {
    return {
      fee: 0,
      billableKm: 0,
      isFreeRadius: true,
      explanation: `Within ${FREE_DELIVERY_KM} km of CAB Steel (${km} km, free delivery)`,
    };
  }
  const excessKm = +(km - FREE_DELIVERY_KM).toFixed(2);
  const fee = +(excessKm * DELIVERY_RATE_PER_KM).toFixed(2);
  return {
    fee,
    billableKm: excessKm,
    isFreeRadius: false,
    explanation: `First ${FREE_DELIVERY_KM} km free, plus ${excessKm} km × ₱${DELIVERY_RATE_PER_KM} per km`,
  };
}

export function formatPHP(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}
