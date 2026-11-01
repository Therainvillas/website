export function makeTitle(base) {
  if (!base) return 'The Rain Villas';
  const suffix = ' | The Rain Villas';
  if ((base + suffix).length <= 62) return base + suffix;
  if (base.length <= 60) return base;
  return base.slice(0, 57).trim() + '...';
}

export function makeDescription(text) {
  if (!text) return '';
  if (text.length <= 155) return text;
  return text.slice(0, 152).trim() + '...';
}

export function countVillas(villas) {
  return Array.isArray(villas) ? villas.length : 0;
}

export function getMinPrice(villas) {
  if (!Array.isArray(villas) || villas.length === 0) return null;
  const prices = villas
    .map((v) => {
      if (Array.isArray(v.pricingLabels) && v.pricingLabels.length) {
        const min = Math.min(...v.pricingLabels.map((p) => Number(p.price) || Infinity));
        return min === Infinity ? null : min;
      }
      return Number(v.price) || null;
    })
    .filter((p) => p && p > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
}

export function formatIdr(num) {
  if (typeof num !== 'number') return String(num);
  return new Intl.NumberFormat('id-ID').format(num);
}
