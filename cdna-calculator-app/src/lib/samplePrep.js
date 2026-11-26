// Lógica pura do preparo de amostras (RNA + água) — sem React, fácil de testar.

export const DEFAULT_REACTION_VOLUME = 20; // µL
export const DEFAULT_TARGET_MASS = 1000; // ng
export const MIN_PIPETTE_VOLUME = 0.5; // µL — abaixo disso a pipetagem fica imprecisa
const DILUTION_FACTORS = [2, 5, 10, 20, 25, 50, 100, 200, 500, 1000];

/** Converte texto em número aceitando vírgula decimal ("152,3"). Retorna NaN se inválido. */
export function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return NaN;
  const cleaned = String(value).trim().replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(cleaned)) return NaN;
  return Number(cleaned);
}

/** Volume livre por reação para RNA + água = volume final − soma do master mix por reação. */
export function getFreeVolume(kit) {
  const reactionVolume = parseNumber(kit?.reactionVolume);
  const finalVolume = Number.isFinite(reactionVolume) && reactionVolume > 0 ? reactionVolume : DEFAULT_REACTION_VOLUME;
  const mixPerReaction = (kit?.reagents || []).reduce((sum, r) => sum + (Number(r.volumePerReaction) || 0), 0);
  const round = (x) => Math.round(x * 1000) / 1000;
  return { finalVolume, mixPerReaction: round(mixPerReaction), freeVolume: round(finalVolume - mixPerReaction) };
}

/** Menor fator de diluição "redondo" que leva o volume de RNA a ≥ 1 µL sem passar do volume livre. */
export function suggestDilution(rnaVolume, freeVolume) {
  for (const factor of DILUTION_FACTORS) {
    const diluted = rnaVolume * factor;
    if (diluted >= 1 && diluted <= freeVolume) return { factor, dilutedVolume: diluted };
  }
  return null;
}

/**
 * Calcula uma linha da tabela.
 * status: 'empty' | 'invalid' | 'ok' | 'low' | 'exceeds'
 */
export function calculateSample(sample, targetMass, freeVolume) {
  const concentration = parseNumber(sample.concentration);
  if (sample.concentration === '' || sample.concentration === undefined || sample.concentration === null) {
    return { ...sample, status: 'empty', rnaVolume: null, waterVolume: null };
  }
  if (!Number.isFinite(concentration) || concentration <= 0 || !Number.isFinite(targetMass) || targetMass <= 0) {
    return { ...sample, status: 'invalid', rnaVolume: null, waterVolume: null };
  }
  const rnaVolume = targetMass / concentration;
  const waterVolume = freeVolume - rnaVolume;

  if (rnaVolume > freeVolume + 1e-9) {
    return { ...sample, concentrationValue: concentration, status: 'exceeds', rnaVolume, waterVolume };
  }
  if (rnaVolume < MIN_PIPETTE_VOLUME) {
    return {
      ...sample,
      concentrationValue: concentration,
      status: 'low',
      rnaVolume,
      waterVolume,
      dilution: suggestDilution(rnaVolume, freeVolume),
    };
  }
  return { ...sample, concentrationValue: concentration, status: 'ok', rnaVolume, waterVolume: Math.max(0, waterVolume) };
}

export function calculateSamples(samples, targetMass, freeVolume) {
  return samples.map((s) => calculateSample(s, targetMass, freeVolume));
}

/** Arredonda para baixo num passo "amigável" para não estourar o volume livre. */
function floorFriendly(value) {
  const step = value >= 1000 ? 10 : value >= 100 ? 5 : value >= 10 ? 1 : 0.1;
  return Math.floor(value / step + 1e-9) * step;
}

/**
 * Massa máxima que cabe em todas as amostras: menor concentração × volume livre.
 * Retorna { mass, limitingSample } ou null se não houver concentrações válidas.
 */
export function getNormalizedMass(samples, freeVolume) {
  if (!(freeVolume > 0)) return null;
  let limiting = null;
  for (const s of samples) {
    const c = parseNumber(s.concentration);
    if (Number.isFinite(c) && c > 0 && (!limiting || c < limiting.c)) limiting = { c, sample: s };
  }
  if (!limiting) return null;
  const mass = floorFriendly(limiting.c * freeVolume);
  return { mass: Number(mass.toFixed(1)), limitingSample: limiting.sample };
}

let idCounter = 0;
export function newSampleId() {
  idCounter += 1;
  return `s-${Date.now().toString(36)}-${idCounter}`;
}

export function makeSample(index, name = '', concentration = '') {
  return { id: newSampleId(), name: name || `Amostra_${String(index + 1).padStart(2, '0')}`, concentration };
}

/** Ajusta o tamanho da lista mantendo as amostras existentes. */
export function resizeSamples(samples, n) {
  if (n === samples.length) return samples;
  if (n < samples.length) return samples.slice(0, n);
  const extra = Array.from({ length: n - samples.length }, (_, i) => makeSample(samples.length + i));
  return [...samples, ...extra];
}

/**
 * Lê texto colado do Excel/NanoDrop/CSV.
 * Regras: cada linha = uma amostra; nome = 1ª coluna; concentração = 1º número depois do nome.
 * Linha só com um número → concentração com nome automático. Linhas sem número (cabeçalho) são ignoradas.
 */
export function parsePastedSamples(text, startIndex = 0) {
  const rows = [];
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    let cols = line.split('\t');
    if (cols.length === 1) cols = line.split(';');
    if (cols.length === 1) cols = line.split(/\s+/);
    // CSV com vírgula ("A1,152.3"), desde que a linha não seja só um número com vírgula decimal ("152,3")
    if (cols.length === 1 && line.includes(',') && !Number.isFinite(parseNumber(line))) cols = line.split(',');
    cols = cols.map((c) => c.trim()).filter((c) => c !== '');
    if (cols.length === 0) continue;

    if (cols.length === 1) {
      const c = parseNumber(cols[0]);
      if (Number.isFinite(c)) rows.push(makeSample(startIndex + rows.length, '', String(c)));
      continue;
    }
    const concCol = cols.slice(1).find((c) => Number.isFinite(parseNumber(c)));
    if (concCol === undefined) continue; // cabeçalho
    rows.push(makeSample(startIndex + rows.length, cols[0], String(parseNumber(concCol))));
  }
  return rows;
}

export function formatVolume(v) {
  return v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toFixed(2);
}
