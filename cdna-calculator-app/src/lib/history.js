// Histórico de experimentos — guardado no navegador (localStorage)

import { calculateSamples, getFreeVolume, parseNumber } from './samplePrep.js';

const HISTORY_KEY = 'master-mix-history';
const LAST_OPERATOR_KEY = 'master-mix-last-operator';

export function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Erro ao salvar o histórico:', error);
    return false;
  }
}

export function getLastOperator() {
  try {
    return localStorage.getItem(LAST_OPERATOR_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastOperator(name) {
  try {
    localStorage.setItem(LAST_OPERATOR_KEY, name);
  } catch {
    /* ignora */
  }
}

/** Data de hoje no formato do <input type="date"> (AAAA-MM-DD), no fuso local. */
export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-11-26" → "26/11/2026" (pt) ou "11/26/2026" (en) sem problemas de fuso. */
export function formatDate(iso, lang = 'pt') {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return lang.startsWith('pt') ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
}

/**
 * Monta o registro de um experimento a partir do estado atual da calculadora.
 * O kit é guardado inteiro (cópia), para o experimento continuar legível mesmo se o kit for editado ou excluído.
 */
export function buildExperiment({ name, operator, date, includeSamples, kit, numberOfSamples, marginType, extraSamples, extraPercentage, reactionCount, results, samples, targetMass }) {
  const { id: kitId, name: kitName, reagents, protocol, notes, reactionVolume } = kit;
  return {
    id: `exp-${Date.now().toString(36)}`,
    name: (name || '').trim(),
    operator: (operator || '').trim(),
    date,
    createdAt: new Date().toISOString(),
    kit: { id: kitId, name: kitName, reagents, protocol, notes, reactionVolume },
    numberOfSamples: Number(numberOfSamples) || 0,
    marginType,
    extraSamples: Number(extraSamples) || 0,
    extraPercentage: Number(extraPercentage) || 0,
    reactionCount,
    results: results.map(({ name: n, volumePerReaction, totalVolume }) => ({ name: n, volumePerReaction, totalVolume })),
    samples: includeSamples ? samples.map(({ id, name: n, concentration, dilutionFactor, originalConcentration }) => ({ id, name: n, concentration, dilutionFactor, originalConcentration })) : null,
    targetMass: includeSamples ? targetMass : null,
  };
}

/** Validação mínima ao importar um arquivo de histórico. */
export function isValidExperiment(e) {
  return e && typeof e.id === 'string' && e.kit && Array.isArray(e.kit.reagents) && Array.isArray(e.results);
}

/** Junta experimentos importados sem duplicar ids; mais recentes primeiro. */
export function mergeHistory(current, imported) {
  const ids = new Set(current.map((e) => e.id));
  const added = imported.filter((e) => isValidExperiment(e) && !ids.has(e.id));
  const merged = [...current, ...added].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  return { merged, addedCount: added.length };
}

/** Texto para busca: nome, operador, kit, data e nomes das amostras. */
export function experimentSearchText(e) {
  return [e.name, e.operator, e.kit?.name, e.date, ...(e.samples || []).map((s) => s.name)].join(' ').toLowerCase();
}

/** Título exibido: nome dado pelo usuário ou "Kit · data". */
export function experimentTitle(e, lang) {
  return e.name || `${e.kit?.name || ''} · ${formatDate(e.date, lang)}`;
}

/** Linhas calculadas da tabela de amostras de um experimento salvo. */
export function experimentSampleRows(e) {
  if (!e.samples) return [];
  return calculateSamples(e.samples, parseNumber(e.targetMass), getFreeVolume(e.kit).freeVolume);
}

