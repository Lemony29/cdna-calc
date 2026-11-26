// src/BenchMode.jsx — Modo bancada: tela de toque para celular/tablet, com checklist do mix e dos tubos

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { ArrowLeft, Check, RotateCcw, Sun, Thermometer, Save, AlertTriangle, Minus, Plus } from 'lucide-react';
import { getDilutionRecipe } from '@/lib/samplePrep.js';
import { getStatusText, localNumber } from '@/lib/sampleFormat.js';

const CHECKS_KEY = 'master-mix-bench-checks';
const SIZE_KEY = 'master-mix-bench-size';

// Mantém a tela acesa enquanto o modo bancada estiver aberto (quando o navegador permite)
function useWakeLock() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) { lock.release(); return; }
        setActive(true);
        lock.addEventListener('release', () => setActive(false));
      } catch {
        setActive(false);
      }
    };
    const onVisible = () => document.visibilityState === 'visible' && request();
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, []);
  return active;
}

function CheckItem({ done, onToggle, children, tone = 'default', disabled = false }) {
  const tones = {
    default: done ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 active:bg-gray-50',
    warn: done ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300',
    error: 'bg-red-50 border-red-200 opacity-80',
  };
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      aria-pressed={done}
      disabled={disabled}
      className={`w-full text-left flex items-center gap-4 rounded-2xl border-2 p-4 transition-colors select-none ${tones[tone]}`}
    >
      <span className={`shrink-0 flex items-center justify-center rounded-full border-2 h-9 w-9 ${done ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 bg-white'}`}>
        {done && <Check className="h-5 w-5" strokeWidth={3} />}
      </span>
      <span className={`flex-1 min-w-0 ${done ? 'opacity-60' : ''}`}>{children}</span>
    </button>
  );
}

function BenchMode({ kit, results, reactionCount, sampleRows, freeInfo, targetMass, onExit, onSave }) {
  const { t } = useTranslation();
  const wakeLockActive = useWakeLock();
  const rows = sampleRows.filter((r) => r.status !== 'empty');
  const mixPerReaction = freeInfo.mixPerReaction;

  // As marcações ficam salvas e só são zeradas quando o experimento muda (outro kit, nº de reações ou amostras)
  const signature = useMemo(
    () => [kit.id, reactionCount, ...results.map((r) => r.totalVolume), ...rows.map((r) => `${r.id}:${r.concentration}`)].join('|'),
    [kit.id, reactionCount, results, rows]
  );
  const [checks, setChecks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHECKS_KEY));
      if (saved && saved.signature === signature) return saved.done || {};
    } catch { /* ignora */ }
    return {};
  });
  const [size, setSize] = useState(() => {
    const saved = Number(localStorage.getItem(SIZE_KEY));
    return saved >= 0 && saved <= 2 ? saved : 1;
  });

  useEffect(() => {
    try { localStorage.setItem(CHECKS_KEY, JSON.stringify({ signature, done: checks })); } catch { /* ignora */ }
  }, [checks, signature]);
  useEffect(() => {
    try { localStorage.setItem(SIZE_KEY, String(size)); } catch { /* ignora */ }
  }, [size]);

  // trava a rolagem da página de trás
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const toggle = (key) => setChecks((c) => ({ ...c, [key]: !c[key] }));
  const resetChecks = () => { if (confirm(t('bench.confirmReset'))) setChecks({}); };

  const checkable = [
    ...results.map((_, i) => `mix-${i}`),
    ...(rows.length ? ['distribute'] : []),
    ...rows.filter((r) => r.status === 'ok' || r.status === 'low').map((r) => `sample-${r.id}`),
  ];
  const doneCount = checkable.filter((k) => checks[k]).length;
  const progress = checkable.length ? Math.round((doneCount / checkable.length) * 100) : 0;

  const textSize = ['text-base', 'text-lg', 'text-xl'][size];
  const volumeSize = ['text-2xl', 'text-3xl', 'text-4xl'][size];
  const vol = (v) => localNumber(Number(v), 2);

  return (
    <div className="fixed inset-0 z-40 bg-gray-50 overflow-y-auto overscroll-contain" role="dialog" aria-label={t('bench.title')}>
      {/* barra superior fixa */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-3 py-2 flex items-center gap-2">
          <Button variant="ghost" className="h-11 px-3" onClick={onExit}>
            <ArrowLeft className="h-5 w-5 mr-1" />{t('bench.exit')}
          </Button>
          <div className="flex-1 min-w-0 text-center">
            <div className="font-semibold truncate">{kit.name}</div>
            <div className="text-xs text-gray-500">{t('bench.progress', { done: doneCount, total: checkable.length })}</div>
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setSize((s) => Math.max(0, s - 1))} disabled={size === 0} aria-label={t('bench.smaller')}><Minus className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setSize((s) => Math.min(2, s + 1))} disabled={size === 2} aria-label={t('bench.bigger')}><Plus className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={resetChecks} aria-label={t('bench.reset')}><RotateCcw className="h-5 w-5" /></Button>
        </div>
        <div className="h-1.5 bg-gray-100">
          <div className="h-full bg-green-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={`max-w-5xl mx-auto p-3 sm:p-5 space-y-6 pb-28 ${textSize}`}>
        {wakeLockActive && (
          <p className="flex items-center justify-center gap-1 text-xs text-gray-500"><Sun className="h-3.5 w-3.5" />{t('bench.screenOn')}</p>
        )}

        {/* 1. Master mix */}
        <section className="space-y-3">
          <h2 className="font-bold text-gray-900">{t('bench.step1', { count: reactionCount })}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((r, i) => (
              <CheckItem key={i} done={!!checks[`mix-${i}`]} onToggle={() => toggle(`mix-${i}`)}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium break-words">{r.name}</span>
                  <span className={`font-bold tabular-nums whitespace-nowrap ${volumeSize}`}>{vol(r.totalVolume)} <span className="text-base font-normal">µL</span></span>
                </span>
              </CheckItem>
            ))}
          </div>
        </section>

        {/* 2. Distribuir */}
        {rows.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900">{t('bench.step2Title')}</h2>
            <CheckItem done={!!checks.distribute} onToggle={() => toggle('distribute')}>
              <span className="flex items-baseline justify-between gap-3">
                <span>{t('bench.step2', { count: rows.length })}</span>
                <span className={`font-bold tabular-nums whitespace-nowrap ${volumeSize}`}>{vol(mixPerReaction)} <span className="text-base font-normal">µL</span></span>
              </span>
            </CheckItem>
          </section>
        )}

        {/* 3. Amostras */}
        {rows.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900">{t('bench.step3', { mass: targetMass })}</h2>
            <p className="text-sm text-gray-600">{t('bench.step3Hint')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rows.map((r, i) => {
                const usable = r.status === 'ok' || r.status === 'low';
                const recipe = r.status === 'low' && r.dilution ? getDilutionRecipe(r.dilution.factor) : null;
                return (
                  <CheckItem
                    key={r.id}
                    done={!!checks[`sample-${r.id}`]}
                    onToggle={() => toggle(`sample-${r.id}`)}
                    tone={r.status === 'low' ? 'warn' : usable ? 'default' : 'error'}
                    disabled={!usable}
                  >
                    <span className="block">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold break-words">
                          <span className="text-gray-400 mr-2 tabular-nums">{i + 1}</span>{r.name}
                        </span>
                        {r.dilutionFactor && <span className="text-xs text-blue-700 whitespace-nowrap">{t('samples.dilutedShort', { factor: r.dilutionFactor })}</span>}
                      </span>
                      {usable ? (
                        <span className="mt-2 grid grid-cols-2 gap-2">
                          <span className="rounded-xl bg-sky-50 px-3 py-2">
                            <span className="block text-xs font-medium text-sky-700">{t('bench.water')}</span>
                            <span className={`block font-bold tabular-nums ${volumeSize}`}>{vol(Math.max(0, r.waterVolume))}</span>
                          </span>
                          <span className="rounded-xl bg-rose-50 px-3 py-2">
                            <span className="block text-xs font-medium text-rose-700">{t('bench.rna')}</span>
                            <span className={`block font-bold tabular-nums ${volumeSize}`}>{vol(r.rnaVolume)}</span>
                          </span>
                        </span>
                      ) : (
                        <span className="mt-2 flex items-center gap-2 text-sm text-red-700"><AlertTriangle className="h-4 w-4" />{getStatusText(r, t)}</span>
                      )}
                      {recipe && (
                        <span className="mt-2 flex items-start gap-2 text-sm text-amber-900">
                          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                          {getStatusText(r, t)} · {t('samples.dilutionRecipe', { rna: localNumber(recipe.rnaVolume), water: localNumber(recipe.waterVolume) })}
                        </span>
                      )}
                    </span>
                  </CheckItem>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. Termociclador */}
        {kit.protocol && (
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Thermometer className="h-5 w-5" />{t('protocol.title')}</h2>
            <div className="rounded-2xl border-2 bg-white p-4 whitespace-pre-wrap font-mono">{kit.protocol}</div>
          </section>
        )}
      </div>

      {/* barra inferior fixa */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-5xl mx-auto p-3 flex gap-2">
          <Button variant="outline" className="h-12 flex-1 text-base" onClick={onExit}>{t('bench.exit')}</Button>
          <Button className="h-12 flex-[2] text-base" onClick={onSave}><Save className="h-5 w-5 mr-2" />{t('history.saveTitle')}</Button>
        </div>
      </div>
    </div>
  );
}

export default BenchMode;
