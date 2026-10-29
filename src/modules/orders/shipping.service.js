/**
 * WuazeShop - Cargo Shipping Fee & Volumetric Calculation Service
 * Liaison aérienne cargo Shenzhen (Chine) -> Libreville (Gabon)
 */

export const DEFAULT_CARGO_SETTINGS = {
  normalRate: 10000,   // FCFA par kg
  normalDelay: '2 semaines',
  expressRate: 13500,  // FCFA par kg
  expressDelay: '1 semaine',
  minWeight: 0.1       // Plancher minimal de 100g pour éviter 0 FCFA
};

/**
 * Calcule le montant d'expédition en fonction du poids total et de la formule choisie.
 * @param {number} totalWeight - Poids total en kg
 * @param {'normal'|'express'} method - Formule choisie
 * @param {object} customSettings - Réglages optionnels issus du CMS site_settings
 * @returns {number} Montant du fret en FCFA (arrondi)
 */
export function calculateShippingFee(totalWeight, method = 'normal', customSettings = {}) {
  const settings = { ...DEFAULT_CARGO_SETTINGS, ...customSettings };
  const rawWeight = Number(totalWeight) || 0;
  const minWeight = Number(settings.minWeight) || 0.1;
  const billableWeight = Math.max(rawWeight, minWeight);

  const rate = method === 'express' 
    ? (Number(settings.expressRate) || 13500)
    : (Number(settings.normalRate) || 10000);

  return Math.round(billableWeight * rate);
}

/**
 * Calcule le poids volumétrique standard du fret aérien : (Longueur x Largeur x Hauteur) / 5000
 * @param {number} lengthCm - Longueur en cm
 * @param {number} widthCm - Largeur en cm
 * @param {number} heightCm - Hauteur en cm
 * @returns {number} Poids volumétrique en kg arrondi à 2 décimales
 */
export function calculateVolumetricWeight(lengthCm, widthCm, heightCm) {
  const l = Number(lengthCm) || 0;
  const w = Number(widthCm) || 0;
  const h = Number(heightCm) || 0;
  if (l <= 0 || w <= 0 || h <= 0) return 0;
  const vol = (l * w * h) / 5000;
  return Math.round(vol * 100) / 100;
}
