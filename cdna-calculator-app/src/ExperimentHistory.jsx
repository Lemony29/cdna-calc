// src/ExperimentHistory.jsx — Salvar experimento + lista do histórico

import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { History, Eye, Printer, RotateCcw, Trash2, Upload, Download, Search, User, CalendarDays, FlaskConical, Grid3X3 } from 'lucide-react';
import { openInQplate } from '@/lib/qplateBridge.js';
import { experimentSampleRows, experimentSearchText, experimentTitle, formatDate, getLastOperator, todayISO } from '@/lib/history.js';
import { formatVolume, getFreeVolume } from '@/lib/samplePrep.js';
import { getStatusText, localNumber } from '@/lib/sampleFormat.js';

/** Diálogo "Salvar experimento": nome (opcional), operador, data e se inclui a tabela de amostras.
 *  Renderize só quando aberto, para os campos começarem limpos a cada vez. */
export function SaveExperimentDialog({ open, onOpenChange, onSave, hasSamples, kitName, reactionCount }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [operator, setOperator] = useState(getLastOperator);
  const [date, setDate] = useState(todayISO);
  const [includeSamples, setIncludeSamples] = useState(hasSamples);
  const [error, setError] = useState('');

  const submit = () => {
    if (!operator.trim()) {
      setError(t('history.operatorRequired'));
      return;
    }
    onSave({ name, operator, date: date || todayISO(), includeSamples: includeSamples && hasSamples });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('history.saveTitle')}
          </DialogTitle>
          <DialogDescription>{t('history.saveDescription', { kit: kitName, count: reactionCount })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="exp-name">{t('history.nameLabel')}</Label>
            <Input id="exp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('history.namePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp-operator">{t('history.operatorLabel')}</Label>
            <Input id="exp-operator" value={operator} onChange={(e) => { setOperator(e.target.value); setError(''); }} placeholder={t('history.operatorPlaceholder')} autoComplete="name" />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp-date">{t('history.dateLabel')}</Label>
            <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <label className={`flex items-center gap-2 text-sm ${hasSamples ? '' : 'text-gray-400'}`}>
            <input type="checkbox" className="w-4 h-4" checked={includeSamples && hasSamples} disabled={!hasSamples} onChange={(e) => setIncludeSamples(e.target.checked)} />
            {hasSamples ? t('history.includeSamples') : t('history.noSamples')}
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('buttons.cancel')}</Button>
            <Button onClick={submit}>{t('history.saveButton')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExperimentDetail({ experiment, onClose, onPrint, onLoad }) {
  const { t, i18n } = useTranslation();
  if (!experiment) return null;
  const e = experiment;
  const rows = experimentSampleRows(e).filter((r) => r.status !== 'empty');
  const free = getFreeVolume(e.kit).freeVolume;
  const total = e.results.reduce((s, r) => s + (parseFloat(r.totalVolume) || 0), 0);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{experimentTitle(e, i18n.language)}</DialogTitle>
          <DialogDescription>
            {formatDate(e.date, i18n.language)} · {e.operator} · {e.kit?.name} · {t('results.description', { count: e.reactionCount })}
          </DialogDescription>
        </DialogHeader>

        <h3 className="font-semibold mt-2">{t('results.title')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">{t('results.reagent')}</th>
              <th className="text-right p-2">{t('results.volumePerReaction')}</th>
              <th className="text-right p-2">{t('results.totalVolume')}</th>
            </tr>
          </thead>
          <tbody>
            {e.results.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{r.name}</td>
                <td className="p-2 text-right">{r.volumePerReaction}</td>
                <td className="p-2 text-right font-semibold">{r.totalVolume}</td>
              </tr>
            ))}
            <tr>
              <td className="p-2 font-semibold" colSpan={2}>{t('results.totalFinalVolume')}</td>
              <td className="p-2 text-right font-semibold">{total.toFixed(2)} µL</td>
            </tr>
          </tbody>
        </table>

        {rows.length > 0 && (
          <>
            <h3 className="font-semibold mt-4">{t('samples.title')}</h3>
            <p className="text-sm text-gray-600">{t('samples.summary', { mass: e.targetMass, free: localNumber(free) })}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">{t('samples.colName')}</th>
                    <th className="text-right p-2">{t('samples.colConcentration')}</th>
                    <th className="text-right p-2">{t('samples.colRna')}</th>
                    <th className="text-right p-2">{t('samples.colWater')}</th>
                    <th className="text-left p-2">{t('samples.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-2">{r.name}{r.dilutionFactor ? ` (${t('samples.dilutedShort', { factor: r.dilutionFactor })})` : ''}</td>
                      <td className="p-2 text-right">{r.concentration}</td>
                      <td className="p-2 text-right font-semibold">{r.status === 'exceeds' ? '—' : formatVolume(r.rnaVolume)}</td>
                      <td className="p-2 text-right font-semibold">{r.status === 'exceeds' ? '—' : formatVolume(r.waterVolume)}</td>
                      <td className="p-2 text-xs">{getStatusText(r, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {e.kit?.protocol && (
          <>
            <h3 className="font-semibold mt-4">{t('protocol.title')}</h3>
            <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm font-mono">{e.kit.protocol}</div>
          </>
        )}

        <div className="flex flex-wrap gap-2 justify-end pt-4">
          {e.samples && e.samples.length > 0 && (
            <Button variant="outline" onClick={() => openInQplate({ project: experimentTitle(e, i18n.language), samples: e.samples }) || alert(t('qplate.noSamples'))}>
              <Grid3X3 className="h-4 w-4 mr-2" />{t('qplate.button')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onPrint(e)}><Printer className="h-4 w-4 mr-2" />{t('buttons.printProtocol')}</Button>
          <Button onClick={() => onLoad(e)}><RotateCcw className="h-4 w-4 mr-2" />{t('history.loadButton')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExperimentHistory({ history, onDelete, onLoad, onPrint, onImport }) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [viewing, setViewing] = useState(null);
  const fileRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? history.filter((e) => experimentSearchText(e).includes(q)) : history;
  }, [history, query]);

  const exportJson = () => {
    if (!history.length) {
      alert(t('history.nothingToExport'));
      return;
    }
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_cdna_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) throw new Error(t('history.importInvalid'));
        onImport(parsed);
      } catch (error) {
        alert(t('alerts.importFileError', { message: error.message }));
      } finally {
        event.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />{t('history.title')}</CardTitle>
        <CardDescription>{t('history.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('history.searchPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" title="JSON" onClick={() => fileRef.current.click()}><Upload className="h-4 w-4 mr-2" />{t('history.import')}</Button>
            <input type="file" ref={fileRef} onChange={importJson} accept=".json" className="hidden" />
            <Button variant="outline" title="JSON" onClick={exportJson}><Download className="h-4 w-4 mr-2" />{t('history.export')}</Button>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">{t('history.empty')}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">{t('history.noResults')}</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((e) => (
              <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-gray-50">
                <button type="button" className="text-left flex-1 min-w-0" onClick={() => setViewing(e)}>
                  <div className="font-medium truncate">{experimentTitle(e, i18n.language)}</div>
                  <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(e.date, i18n.language)}</span>
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{e.operator}</span>
                    <span className="flex items-center gap-1"><FlaskConical className="h-3.5 w-3.5" />{e.kit?.name} · {t('history.reactions', { count: e.reactionCount })}</span>
                    {e.samples && <span>{t('history.samplesCount', { count: e.samples.filter((s) => s.concentration !== '').length })}</span>}
                  </div>
                </button>
                <div className="flex gap-1 self-end sm:self-auto">
                  <Button variant="ghost" size="icon" onClick={() => setViewing(e)} aria-label={t('history.view')} title={t('history.view')}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onPrint(e)} aria-label={t('buttons.printProtocol')} title={t('buttons.printProtocol')}><Printer className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onLoad(e)} aria-label={t('history.loadButton')} title={t('history.loadButton')}><RotateCcw className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(e.id)} aria-label={t('history.delete')} title={t('history.delete')}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ExperimentDetail
        experiment={viewing}
        onClose={() => setViewing(null)}
        onPrint={(e) => { setViewing(null); onPrint(e); }}
        onLoad={(e) => { setViewing(null); onLoad(e); }}
      />
    </Card>
  );
}

export default ExperimentHistory;
