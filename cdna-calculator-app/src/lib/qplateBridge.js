// Ponte com o qPlate Architect (qplate-architect.vercel.app):
// abre o qPlate em outra aba levando o nome do projeto e a lista de amostras no endereço (#import=...).

export const QPLATE_URL = 'https://qplate-architect.vercel.app/';

function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Nomes a enviar: amostras com concentração preenchida; se nenhuma tiver, todas as que têm nome. */
export function samplesForQplate(samples) {
  const withConcentration = samples.filter((s) => String(s.concentration ?? '').trim() !== '' && s.name?.trim());
  const list = withConcentration.length ? withConcentration : samples.filter((s) => s.name?.trim());
  return list.map((s) => s.name.trim());
}

export function buildQplateLink({ project = '', sampleNames }) {
  const payload = { source: 'lab-mastermix', v: 1, project, samples: sampleNames };
  return `${QPLATE_URL}#import=${encodeBase64Url(JSON.stringify(payload))}`;
}

export function openInQplate({ project, samples }) {
  const sampleNames = samplesForQplate(samples);
  if (!sampleNames.length) return false;
  window.open(buildQplateLink({ project, sampleNames }), '_blank', 'noopener');
  return true;
}
