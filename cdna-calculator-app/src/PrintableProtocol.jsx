// src/PrintableProtocol.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

// Este componente recebe os dados do kit e os resultados como propriedades
const PrintableProtocol = React.forwardRef(({ kit, results }, ref) => {
  const { t } = useTranslation();
  const today = new Date().toLocaleDateString();

  return (
    // Este div principal é o que vamos mostrar na impressão
    <div ref={ref} className="printable-content">
      <div className="p-8">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold">{kit.id === 'default-kit' ? t('defaultKit.name') : kit.name}</h1>
          <p className="text-md text-gray-600">Protocolo e Master Mix - Gerado em: {today}</p>
        </header>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">{t('kitModal.protocolLabel')}</h2>
          {/* Usamos 'whitespace-pre-wrap' para manter as quebras de linha do protocolo */}
          <p className="p-4 border rounded-md whitespace-pre-wrap bg-gray-50">
            {kit.protocol || "Nenhum protocolo definido."}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">{t('results.title')}</h2>
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

        {kit.notes && (
          <section className="mt-8">
             <h2 className="text-2xl font-semibold mb-3">{t('kitModal.notesLabel')}</h2>
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