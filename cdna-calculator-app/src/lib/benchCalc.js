// Calculadoras de bancada — fórmulas puras, testáveis.

/** C1·V1 = C2·V2: informe três valores (o quarto null) e recebe o que falta. */
export function solveC1V1({ c1, v1, c2, v2 }) {
  const vals = { c1, v1, c2, v2 };
  const missing = Object.keys(vals).filter((k) => !(Number.isFinite(vals[k]) && vals[k] > 0));
  if (missing.length !== 1) return null;
  const k = missing[0];
  let value;
  if (k === 'c1') value = (c2 * v2) / v1;
  if (k === 'v1') value = (c2 * v2) / c1;
  if (k === 'c2') value = (c1 * v1) / v2;
  if (k === 'v2') value = (c1 * v1) / c2;
  const result = { ...vals, [k]: value, solved: k };
  result.diluent = result.v2 - result.v1;
  result.valid = result.c2 <= result.c1 && result.v1 <= result.v2;
  return result;
}

/**
 * Diluição seriada: cada tubo recebe `diluent` de diluente e `transfer` do tubo anterior (ou do estoque),
 * homogeneiza e passa `transfer` para o próximo. Sobra `remaining` µL em cada tubo (o último fica com remaining + transfer).
 */
export function serialDilution({ stock, factor, points, remaining }) {
  if (!(stock > 0 && factor > 1 && points >= 1 && points <= 24 && remaining > 0)) return null;
  const transfer = remaining / (factor - 1);
  const diluent = remaining;
  const tubes = Array.from({ length: Math.round(points) }, (_, i) => ({
    tube: i + 1,
    concentration: stock / factor ** (i + 1),
    diluent,
    transfer,
  }));
  return { transfer, diluent, tubes, stockNeeded: transfer };
}

const MOLAR_UNITS = { M: 1, mM: 1e-3, µM: 1e-6, nM: 1e-9 };
const VOLUME_UNITS = { L: 1, mL: 1e-3, µL: 1e-6 };

/** Massa (g) para uma solução molar: m = C × V × MM. */
export function molarMass({ concentration, concentrationUnit = 'mM', volume, volumeUnit = 'mL', molarMassValue }) {
  if (!(concentration > 0 && volume > 0 && molarMassValue > 0)) return null;
  return concentration * MOLAR_UNITS[concentrationUnit] * volume * VOLUME_UNITS[volumeUnit] * molarMassValue;
}

/** Massa (g) para % m/v: g = % × V(mL) / 100. */
export function percentMass({ percent, volume, volumeUnit = 'mL' }) {
  if (!(percent > 0 && volume > 0)) return null;
  return (percent * volume * VOLUME_UNITS[volumeUnit] * 1000) / 100;
}

/** Escolhe a unidade de massa mais legível. */
export function humanMass(grams) {
  if (!(grams > 0)) return null;
  if (grams >= 1) return { value: grams, unit: 'g' };
  if (grams >= 1e-3) return { value: grams * 1e3, unit: 'mg' };
  if (grams >= 1e-6) return { value: grams * 1e6, unit: 'µg' };
  return { value: grams * 1e9, unit: 'ng' };
}

/**
 * Primer liofilizado: volume de água para o estoque (µL = nmol × 1000 / µM)
 * e preparo da solução de trabalho por C1V1.
 */
export function primerResuspension({ nmol, stockMicromolar = 100, workingMicromolar = 10, workingVolume = 100 }) {
  if (!(nmol > 0 && stockMicromolar > 0)) return null;
  const waterForStock = (nmol * 1000) / stockMicromolar;
  let working = null;
  if (workingMicromolar > 0 && workingVolume > 0 && workingMicromolar <= stockMicromolar) {
    const stockVolume = (workingMicromolar * workingVolume) / stockMicromolar;
    working = { stockVolume, water: workingVolume - stockVolume };
  }
  return { waterForStock, working };
}

/** Centrífuga: RCF (× g) = 1,118 × 10⁻⁵ × r(cm) × rpm². */
export function rpmToG(rpm, radiusCm) {
  if (!(rpm > 0 && radiusCm > 0)) return null;
  return 1.118e-5 * radiusCm * rpm ** 2;
}
export function gToRpm(g, radiusCm) {
  if (!(g > 0 && radiusCm > 0)) return null;
  return Math.sqrt(g / (1.118e-5 * radiusCm));
}

/**
 * Câmara de Neubauer (quadrantes grandes de 1 mm² × 0,1 mm = 0,1 µL):
 * células/mL = média por quadrante × fator de diluição × 10⁴.
 */
export function neubauer({ counts, dilution = 1, deadCounts = [] }) {
  const live = counts.filter((c) => Number.isFinite(c) && c >= 0);
  if (!live.length || !(dilution > 0)) return null;
  const meanLive = live.reduce((a, b) => a + b, 0) / live.length;
  const perMl = meanLive * dilution * 1e4;
  const dead = deadCounts.filter((c) => Number.isFinite(c) && c >= 0);
  let viability = null;
  if (dead.length) {
    const meanDead = dead.reduce((a, b) => a + b, 0) / dead.length;
    viability = meanLive + meanDead > 0 ? (meanLive / (meanLive + meanDead)) * 100 : null;
  }
  return { meanLive, perMl, viability, quadrants: live.length };
}

/** Plaqueamento: volume de suspensão e de meio para N poços (com margem extra em %). */
export function plating({ cellsPerMl, cellsPerWell, wells, volumePerWell, extraPercent = 10 }) {
  if (!(cellsPerMl > 0 && cellsPerWell > 0 && wells > 0 && volumePerWell > 0)) return null;
  const factor = wells * (1 + (extraPercent > 0 ? extraPercent : 0) / 100);
  const totalCells = cellsPerWell * factor;
  const totalVolume = volumePerWell * factor; // µL
  const suspension = (totalCells / cellsPerMl) * 1000; // µL
  return { totalCells, totalVolume, suspension, medium: totalVolume - suspension, enough: suspension <= totalVolume };
}
