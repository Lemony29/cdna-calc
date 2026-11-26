// src/SamplePrep.jsx — Tabela de preparo das amostras (volume de RNA + água por tubo)

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { FlaskConical, ClipboardPaste, Copy, Download, Plus, Trash2, Scale, AlertTriangle } from 'lucide-react';
import {
  calculateSamples,
  formatVolume,
  getNormalizedMass,
  makeSample,
  parseNumber,
  parsePastedSamples,
  MIN_PIPETTE_VOLUME,
} from '@/lib/samplePrep.js';
import { getStatusText, localNumber } from '@/lib/sampleFormat.js';

const STATUS_STYLES = {
  ok: 'bg-green-100 text-green-800 border-green-200',
  low: 'bg-amber-100 text-amber-800 border-amber-200',
  exceeds: 'bg-red-100 text-red-800 border-red-200',
  invalid: 'bg-red-100 text-red-800 border-red-200',
  empty: 'bg-gray-100 text-gray-500 border-gray-200',
};

function SamplePrep({ samples, onSamplesChange, targetMass, onTargetMassChange, freeInfo }) {
  const { t, i18n } = useTranslation();
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  const { finalVolume, mixPerReaction, freeVolume } = freeInfo;
  const mass = parseNumber(targetMass);
  const rows = useMemo(() => calculateSamples(samples, mass, freeVolume), [samples, mass, freeVolume]);
  const normalized = useMemo(() => getNormalizedMass(samples, freeVolume), [samples, freeVolume]);
  const exceedingCount = rows.filter((r) => r.status === 'exceeds').length;
  const lowCount = rows.filter((r) => r.status === 'low').length;
  const usable = rows.filter((r) => r.status === 'ok' || r.status === 'low');
  const totalRna = usable.reduce((s, r) => s + r.rnaVolume, 0);
  const totalWater = usable.reduce((s, r) => s + Math.max(0, r.waterVolume), 0);
  const pastePreview = useMemo(() => parsePastedSamples(pasteText), [pasteText]);
  const isPt = i18n.language?.startsWith('pt');

  const updateSample = (index, field, value) => {
    onSamplesChange(samples.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeSample = (index) => {
    const next = samples.filter((_, i) => i !== index);
    onSamplesChange(next.length ? next : [makeSample(0)]);
  };

  const addSample = () => onSamplesChange([...samples, makeSample(samples.length)]);

  const clearSamples = () => {
    if (confirm(t('samples.confirmClear'))) onSamplesChange([makeSample(0)]);
  };

  // Colar várias linhas direto numa célula: substitui a partir daquela linha
  const handleCellPaste = (index) => (e) => {
    const text = e.clipboardData.getData('text');
    if (!/[\n\t]/.test(text.trim())) return; // colagem simples: comportamento normal
    const parsed = parsePastedSamples(text, index);
    if (!parsed.length) return;
    e.preventDefault();
    const next = [...samples.slice(0, index), ...parsed, ...samples.slice(index + parsed.length)];
    onSamplesChange(next);
  };

  const applyPaste = (mode) => {
    if (!pastePreview.length) return;
    if (mode === 'replace') {
      onSamplesChange(parsePastedSamples(pasteText, 0));
    } else {
      // descarta linhas finais vazias antes de anexar
      let base = [...samples];
      while (base.length && base[base.length - 1].concentration === '') base.pop();
      onSamplesChange([...base, ...parsePastedSamples(pasteText, base.length)]);
    }
    setPasteText('');
    setIsPasteOpen(false);
  };

  const fmt = (v) => (isPt ? formatVolume(v).replace('.', ',') : formatVolume(v));

  const buildTable = (sep, localized) => {
    const f = (v) => (localized ? fmt(v) : formatVolume(v));
    const header = [t('samples.colName'), t('samples.colConcentration'), t('samples.colRna'), t('samples.colWater'), t('samples.colStatus')];
    const conc = (c) => {
      const s = String(c ?? '');
      return localized && isPt ? s.replace('.', ',') : s;
    };
    const vol = (r, v) => (r.status === 'exceeds' ? '—' : f(v));
    const body = rows.map((r) => [r.name, conc(r.concentration), vol(r, r.rnaVolume), vol(r, r.waterVolume), getStatusText(r, t)]);
    const esc = (x) => (sep !== '\t' && /[;"\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
    return [header, ...body].map((cols) => cols.map((c) => esc(String(c))).join(sep)).join('\n');
  };

  const copyTable = () => {
    const intro = `${t('samples.title')} — ${t('samples.summary', { mass: targetMass, free: localNumber(freeVolume) })}\n`;
    navigator.clipboard
      .writeText(intro + buildTable('\t', true))
      .then(() => setCopyFeedback(t('buttons.copied')))
      .catch(() => setCopyFeedback(t('alerts.copyFailed')))
      .finally(() => setTimeout(() => setCopyFeedback(''), 2000));
  };

  const exportCsv = () => {
    const csv = '﻿' + buildTable(';', true);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amostras_cdna_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              {t('samples.title')}
            </CardTitle>
            <CardDescription>{t('samples.description')}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPasteOpen(true)}>
              <ClipboardPaste className="h-4 w-4 mr-2" />
              {t('samples.pasteButton')}
            </Button>
            <Button variant="outline" size="sm" onClick={copyTable}>
              <Copy className="h-4 w-4 mr-2" />
              {copyFeedback || t('buttons.copy')}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Parâmetros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="target-mass">{t('samples.targetMassLabel')}</Label>
            <Input
              id="target-mass"
              inputMode="decimal"
              value={targetMass}
              onChange={(e) => onTargetMassChange(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>{t('samples.freeVolumeLabel')}</Label>
            <div className={`h-10 flex items-center px-3 rounded-md border text-sm ${freeVolume > 0 ? 'bg-gray-50' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {t('samples.freeVolumeFormula', { final: localNumber(finalVolume), mix: localNumber(mixPerReaction), free: localNumber(freeVolume) })}
            </div>
          </div>
          <Button variant="outline" onClick={() => normalized && onTargetMassChange(String(normalized.mass))} disabled={!normalized}>
            <Scale className="h-4 w-4 mr-2" />
            {normalized ? t('samples.normalizeButton', { mass: localNumber(normalized.mass) }) : t('samples.normalizeButtonEmpty')}
          </Button>
        </div>

        {freeVolume <= 0 && (
          <div className="flex gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {t('samples.noFreeVolume')}
          </div>
        )}
        {exceedingCount > 0 && normalized && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-900">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{t('samples.exceedsBanner', { count: exceedingCount, mass: localNumber(normalized.mass), sample: normalized.limitingSample.name })}</span>
            </div>
            <Button size="sm" onClick={() => onTargetMassChange(String(normalized.mass))}>
              {t('samples.normalizeShort')}
            </Button>
          </div>
        )}
        {lowCount > 0 && (
          <div className="flex gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {t('samples.lowBanner', { count: lowCount, min: localNumber(MIN_PIPETTE_VOLUME) })}
          </div>
        )}

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-semibold w-8">#</th>
                <th className="text-left p-2 font-semibold">{t('samples.colName')}</th>
                <th className="text-left p-2 font-semibold w-36">{t('samples.colConcentration')}</th>
                <th className="text-right p-2 font-semibold">{t('samples.colRna')}</th>
                <th className="text-right p-2 font-semibold">{t('samples.colWater')}</th>
                <th className="text-left p-2 font-semibold">{t('samples.colStatus')}</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-500">{index + 1}</td>
                  <td className="p-1">
                    <Input
                      className="h-9"
                      value={row.name}
                      onChange={(e) => updateSample(index, 'name', e.target.value)}
                      onPaste={handleCellPaste(index)}
                      aria-label={`${t('samples.colName')} ${index + 1}`}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-9"
                      inputMode="decimal"
                      placeholder="ng/µL"
                      value={row.concentration}
                      onChange={(e) => updateSample(index, 'concentration', e.target.value)}
                      onPaste={handleCellPaste(index)}
                      aria-label={`${t('samples.colConcentration')} ${index + 1}`}
                    />
                  </td>
                  <td className="p-2 text-right font-semibold tabular-nums">{row.status === 'exceeds' ? '—' : fmt(row.rnaVolume)}</td>
                  <td className="p-2 text-right font-semibold tabular-nums">{row.status === 'exceeds' ? '—' : fmt(row.waterVolume)}</td>
                  <td className="p-2">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[row.status]}`}>
                      {getStatusText(row, t)}
                    </span>
                  </td>
                  <td className="p-1">
                    <Button variant="ghost" size="icon" onClick={() => removeSample(index)} aria-label={t('samples.remove')}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {usable.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td className="p-2" colSpan={3}>{t('samples.totals')}</td>
                  <td className="p-2 text-right tabular-nums">{fmt(totalRna)}</td>
                  <td className="p-2 text-right tabular-nums">{fmt(totalWater)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex flex-wrap gap-2 justify-between">
          <Button variant="outline" size="sm" onClick={addSample}>
            <Plus className="h-4 w-4 mr-2" />
            {t('samples.addSample')}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSamples} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            {t('samples.clear')}
          </Button>
        </div>
        <p className="text-xs text-gray-500">{t('samples.hint')}</p>
      </CardContent>

      <Dialog open={isPasteOpen} onOpenChange={setIsPasteOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5" />
              {t('samples.pasteTitle')}
            </DialogTitle>
            <DialogDescription>{t('samples.pasteDescription')}</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={8}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'P01\t152,3\nP02\t88,4\nP03\t230'}
            className="font-mono text-sm"
          />
          <p className="text-sm text-gray-600">{t('samples.pastePreview', { count: pastePreview.length })}</p>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsPasteOpen(false)}>{t('buttons.cancel')}</Button>
            <Button variant="outline" onClick={() => applyPaste('append')} disabled={!pastePreview.length}>{t('samples.pasteAppend')}</Button>
            <Button onClick={() => applyPaste('replace')} disabled={!pastePreview.length}>{t('samples.pasteReplace')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default SamplePrep;
