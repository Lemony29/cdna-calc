// src/PrintableProtocol.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getStatusText, localNumber } from '@/lib/sampleFormat.js';
import { formatVolume, getDilutionRecipe } from '@/lib/samplePrep.js';
import { formatDate } from '@/lib/history.js';

// Este componente recebe os dados do kit e os resultados como propriedades
const PrintableProtocol = React.forwardRef(({ kit, results, reactionCount, sampleRows = [], targetMass, freeInfo, meta }, ref) => {
  const { t, i18n } = useTranslation();
  const today = new Date().toLocaleDateString();

  return (
    // Este div principal é o que vamos mostrar na impressão
    <div ref={ref} className="printable-content">
      <div className="p-8">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold">{kit.name}</h1>
          {meta?.name && <p className="text-xl font-semibold">{meta.name}</p>}
          {meta && <p className="text-md">{t('print.experimentMeta', { date: formatDate(meta.date, i18n.language), operator: meta.operator })}</p>}
          <p className="text-md text-gray-600">{t('print.generatedOn', { date: today })}</p>
        </header>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">{t('protocol.title')}</h2>
          {/* Usamos 'whitespace-pre-wrap' para manter as quebras de linha do protocolo */}
          <p className="p-4 border rounded-md whitespace-pre-wrap bg-gray-50">
            {kit.protocol || t('protocol.none')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-1">{t('results.title')}</h2>
          {reactionCount && <p className="text-sm text-gray-600 mb-3">{t('results.description', { count: reactionCount })}</p>}
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left font-semibold">{t('results.reagent')}</th>
                <th className="border p-2 text-right font-semibold">{t('results.volumePerReaction')}</th>
                <th className="border p-2 text-right font-semibold">{t('results.totalVolume')}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((reagent, index) => (
                <tr key={index}>
                  <td className="border p-2">{reagent.name}</td>
                  <td className="border p-2 text-right">{reagent.volumePerReaction}</td>
                  <td className="border p-2 text-right font-bold">{reagent.totalVolume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {sampleRows.some((r) => r.concentration !== '') && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-1">{t('samples.title')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('samples.summary', { mass: targetMass, free: localNumber(freeInfo?.freeVolume ?? '') })}</p>
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">#</th>
                  <th className="border p-2 text-left">{t('samples.colName')}</th>
                  <th className="border p-2 text-right">{t('samples.colConcentration')}</th>
                  <th className="border p-2 text-right">{t('samples.colRna')}</th>
                  <th className="border p-2 text-right">{t('samples.colWater')}</th>
                  <th className="border p-2 text-left">{t('samples.colStatus')}</th>
                  <th className="border p-2 text-center w-12">✓</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.filter((r) => r.status !== 'empty').map((r, i) => (
                  <tr key={r.id}>
                    <td className="border p-2">{i + 1}</td>
                    <td className="border p-2">{r.name}{r.dilutionFactor ? ` (${t('samples.dilutedShort', { factor: r.dilutionFactor })})` : ''}</td>
                    <td className="border p-2 text-right">{r.concentration}</td>
                    <td className="border p-2 text-right font-bold">{r.status === 'exceeds' ? '—' : formatVolume(r.rnaVolume)}</td>
                    <td className="border p-2 text-right font-bold">{r.status === 'exceeds' ? '—' : formatVolume(r.waterVolume)}</td>
                    <td className="border p-2">
                      {getStatusText(r, t)}
                      {r.status === 'low' && r.dilution && (
                        <div className="text-xs">{(() => { const d = getDilutionRecipe(r.dilution.factor); return t('samples.dilutionRecipe', { rna: localNumber(d.rnaVolume), water: localNumber(d.waterVolume) }); })()}</div>
                      )}
                    </td>
                    <td className="border p-2"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {kit.notes && (
          <section className="mt-8">
             <h2 className="text-2xl font-semibold mb-3">{t('protocol.notes')}</h2>
             <p className="p-4 border rounded-md whitespace-pre-wrap bg-yellow-50">
               {kit.notes}
             </p>
          </section>
        )}
      </div>
    </div>
  );
});

export default PrintableProtocol;