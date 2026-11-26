// Formatação dependente do idioma para a tabela de amostras
import i18next from 'i18next';
import { MIN_PIPETTE_VOLUME } from './samplePrep.js';

// Número com vírgula decimal em português
export function localNumber(value, digits) {
  const text = digits === undefined ? String(value) : Number(value).toFixed(digits);
  return i18next.language?.startsWith('pt') ? text.replace('.', ',') : text;
}

// Texto do status de uma linha calculada (ok, low, exceeds, invalid, empty)
export function getStatusText(row, t) {
  if (row.status === 'low') {
    return row.dilution
      ? t('samples.status.lowDilute', { factor: row.dilution.factor, volume: localNumber(row.dilution.dilutedVolume, 2) })
      : t('samples.status.low', { min: localNumber(MIN_PIPETTE_VOLUME) });
  }
  return t(`samples.status.${row.status}`);
}
