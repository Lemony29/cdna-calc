// src/Calculators.jsx — Calculadoras de bancada

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Beaker, ListOrdered, Scale, Dna, RotateCw, Microscope, AlertTriangle } from 'lucide-react';
import { parseNumber } from '@/lib/samplePrep.js';
import { gToRpm, humanMass, molarMass, neubauer, percentMass, plating, primerResuspension, rpmToG, serialDilution, solveC1V1 } from '@/lib/benchCalc.js';

const n = (v) => {
  const x = parseNumber(v);
  return Number.isFinite(x) ? x : null;
};

function useFormat() {
  const { i18n } = useTranslation();
  return (value, digits = 2) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    // números muito pequenos ou muito grandes em notação científica
    if (abs !== 0 && (abs < 0.001 || abs >= 1e9)) return value.toExponential(2).replace('.', i18n.language?.startsWith('pt') ? ',' : '.');
    return new Intl.NumberFormat(i18n.language || 'pt-BR', { maximumFractionDigits: digits }).format(value);
  };
}

function Field({ id, label, value, onChange, suffix, placeholder }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-gray-600">{label}</Label>
      <div className="flex items-center gap-2">
        <Input id={id} inputMode="decimal" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        {suffix && <span className="text-sm text-gray-500 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}

function UnitSelect({ value, onChange, options, label }) {
  return (
    <select aria-label={label} className="h-10 rounded-md border px-2 text-sm bg-white" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Result({ children, tone = 'blue' }) {
  const tones = { blue: 'bg-blue-50 border-blue-200 text-blue-950', amber: 'bg-amber-50 border-amber-200 text-amber-900' };
  return <div className={`rounded-lg border p-3 text-sm space-y-1 ${tones[tone]}`}>{children}</div>;
}

function CalcCard({ icon, title, description, children }) {
  const Icon = icon;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Icon className="h-5 w-5" />{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function C1V1Card() {
  const { t } = useTranslation();
  const f = useFormat();
  const [vals, setVals] = useState({ c1: '', v1: '', c2: '', v2: '' });
  const [unit, setUnit] = useState('µL');
  const set = (k) => (v) => setVals((s) => ({ ...s, [k]: v }));
  const r = solveC1V1({ c1: n(vals.c1), v1: n(vals.v1), c2: n(vals.c2), v2: n(vals.v2) });
  const filled = Object.values(vals).filter((v) => v.trim() !== '').length;
  return (
    <CalcCard icon={Beaker} title={t('calc.c1v1.title')} description={t('calc.c1v1.description')}>
      <div className="grid grid-cols-2 gap-3">
        <Field id="c1" label={t('calc.c1v1.c1')} value={vals.c1} onChange={set('c1')} />
        <Field id="v1" label={t('calc.c1v1.v1')} value={vals.v1} onChange={set('v1')} suffix={unit} />
        <Field id="c2" label={t('calc.c1v1.c2')} value={vals.c2} onChange={set('c2')} />
        <Field id="v2" label={t('calc.c1v1.v2')} value={vals.v2} onChange={set('v2')} suffix={unit} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">{t('calc.volumeUnit')}<UnitSelect value={unit} onChange={setUnit} options={['µL', 'mL', 'L']} label={t('calc.volumeUnit')} /></div>
        <Button variant="ghost" size="sm" onClick={() => setVals({ c1: '', v1: '', c2: '', v2: '' })}>{t('calc.clear')}</Button>
      </div>
      {r ? (
        <Result tone={r.valid ? 'blue' : 'amber'}>
          <p><strong>{t(`calc.c1v1.${r.solved}`)} = {f(r[r.solved], 3)}{r.solved.startsWith('v') ? ` ${unit}` : ''}</strong></p>
          {r.valid
            ? <p>{t('calc.c1v1.recipe', { v1: f(r.v1, 2), diluent: f(r.diluent, 2), unit })}</p>
            : <p className="flex gap-1"><AlertTriangle className="h-4 w-4 shrink-0" />{t('calc.c1v1.invalid')}</p>}
        </Result>
      ) : (
        <p className="text-xs text-gray-500">{filled === 4 ? t('calc.c1v1.leaveOne') : t('calc.c1v1.hint')}</p>
      )}
    </CalcCard>
  );
}

function SerialCard() {
  const { t } = useTranslation();
  const f = useFormat();
  const [stock, setStock] = useState('100');
  const [factor, setFactor] = useState('10');
  const [points, setPoints] = useState('5');
  const [remaining, setRemaining] = useState('90');
  const [unit, setUnit] = useState('ng/µL');
  const r = serialDilution({ stock: n(stock), factor: n(factor), points: n(points), remaining: n(remaining) });
  return (
    <CalcCard icon={ListOrdered} title={t('calc.serial.title')} description={t('calc.serial.description')}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="s-stock" className="text-xs text-gray-600">{t('calc.serial.stock')}</Label>
          <div className="flex gap-2">
            <Input id="s-stock" inputMode="decimal" value={stock} onChange={(e) => setStock(e.target.value)} />
            <Input aria-label={t('calc.serial.unit')} className="w-24" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <Field id="s-factor" label={t('calc.serial.factor')} value={factor} onChange={setFactor} suffix="×" />
        <Field id="s-points" label={t('calc.serial.points')} value={points} onChange={setPoints} />
        <Field id="s-rem" label={t('calc.serial.remaining')} value={remaining} onChange={setRemaining} suffix="µL" />
      </div>
      {r ? (
        <>
          <Result>{t('calc.serial.recipe', { diluent: f(r.diluent, 2), transfer: f(r.transfer, 2) })}</Result>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="p-1">{t('calc.serial.tube')}</th><th className="p-1 text-right">{t('calc.serial.concentration')}</th><th className="p-1 text-right">{t('calc.serial.dilution')}</th></tr></thead>
            <tbody>
              {r.tubes.map((tb) => (
                <tr key={tb.tube} className="border-b">
                  <td className="p-1">{tb.tube}</td>
                  <td className="p-1 text-right tabular-nums">{f(tb.concentration, 4)} {unit}</td>
                  <td className="p-1 text-right tabular-nums">1:{f(n(factor) ** tb.tube, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500">{t('calc.serial.note', { remaining: f(r.diluent, 2), total: f(r.diluent + r.transfer, 2), transfer: f(r.transfer, 2) })}</p>
        </>
      ) : <p className="text-xs text-gray-500">{t('calc.serial.hint')}</p>}
    </CalcCard>
  );
}

function SolutionCard() {
  const { t } = useTranslation();
  const f = useFormat();
  const [mode, setMode] = useState('molar');
  const [conc, setConc] = useState('');
  const [concUnit, setConcUnit] = useState('mM');
  const [volume, setVolume] = useState('');
  const [volUnit, setVolUnit] = useState('mL');
  const [mw, setMw] = useState('');
  const grams = mode === 'molar'
    ? molarMass({ concentration: n(conc), concentrationUnit: concUnit, volume: n(volume), volumeUnit: volUnit, molarMassValue: n(mw) })
    : percentMass({ percent: n(conc), volume: n(volume), volumeUnit: volUnit });
  const mass = humanMass(grams);
  return (
    <CalcCard icon={Scale} title={t('calc.solution.title')} description={t('calc.solution.description')}>
      <div className="flex gap-2">
        {['molar', 'percent'].map((m) => (
          <Button key={m} size="sm" variant={mode === m ? 'default' : 'outline'} className="flex-1" onClick={() => setMode(m)}>{t(`calc.solution.${m}`)}</Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="sol-c" className="text-xs text-gray-600">{t('calc.solution.concentration')}</Label>
          <div className="flex gap-2">
            <Input id="sol-c" inputMode="decimal" value={conc} onChange={(e) => setConc(e.target.value)} />
            {mode === 'molar' ? <UnitSelect value={concUnit} onChange={setConcUnit} options={['M', 'mM', 'µM', 'nM']} label={t('calc.solution.concentration')} /> : <span className="self-center text-sm text-gray-500">% (m/v)</span>}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="sol-v" className="text-xs text-gray-600">{t('calc.solution.volume')}</Label>
          <div className="flex gap-2">
            <Input id="sol-v" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} />
            <UnitSelect value={volUnit} onChange={setVolUnit} options={['L', 'mL', 'µL']} label={t('calc.solution.volume')} />
          </div>
        </div>
        {mode === 'molar' && <Field id="sol-mw" label={t('calc.solution.mw')} value={mw} onChange={setMw} suffix="g/mol" />}
      </div>
      {mass ? (
        <Result><p><strong>{t('calc.solution.result', { mass: f(mass.value, 3), unit: mass.unit })}</strong></p><p>{t('calc.solution.complete', { volume: volume, unit: volUnit })}</p></Result>
      ) : <p className="text-xs text-gray-500">{t('calc.solution.hint')}</p>}
    </CalcCard>
  );
}

function PrimerCard() {
  const { t } = useTranslation();
  const f = useFormat();
  const [nmol, setNmol] = useState('');
  const [stock, setStock] = useState('100');
  const [working, setWorking] = useState('10');
  const [workingVolume, setWorkingVolume] = useState('100');
  const r = primerResuspension({ nmol: n(nmol), stockMicromolar: n(stock), workingMicromolar: n(working), workingVolume: n(workingVolume) });
  return (
    <CalcCard icon={Dna} title={t('calc.primer.title')} description={t('calc.primer.description')}>
      <div className="grid grid-cols-2 gap-3">
        <Field id="p-nmol" label={t('calc.primer.nmol')} value={nmol} onChange={setNmol} suffix="nmol" placeholder="ex.: 25,3" />
        <Field id="p-stock" label={t('calc.primer.stock')} value={stock} onChange={setStock} suffix="µM" />
        <Field id="p-work" label={t('calc.primer.working')} value={working} onChange={setWorking} suffix="µM" />
        <Field id="p-wvol" label={t('calc.primer.workingVolume')} value={workingVolume} onChange={setWorkingVolume} suffix="µL" />
      </div>
      {r ? (
        <Result>
          <p><strong>{t('calc.primer.stockResult', { water: f(r.waterForStock, 1), stock: f(n(stock), 0) })}</strong></p>
          {r.working && <p>{t('calc.primer.workingResult', { volume: f(n(workingVolume), 0), working: f(n(working), 1), stockVolume: f(r.working.stockVolume, 2), water: f(r.working.water, 2) })}</p>}
        </Result>
      ) : <p className="text-xs text-gray-500">{t('calc.primer.hint')}</p>}
    </CalcCard>
  );
}

function CentrifugeCard() {
  const { t } = useTranslation();
  const f = useFormat();
  const [radius, setRadius] = useState('');
  const [rpm, setRpm] = useState('');
  const [g, setG] = useState('');
  const [last, setLast] = useState('rpm');
  const r = n(radius);
  const computed = last === 'rpm' ? rpmToG(n(rpm), r) : gToRpm(n(g), r);
  return (
    <CalcCard icon={RotateCw} title={t('calc.centrifuge.title')} description={t('calc.centrifuge.description')}>
      <div className="grid grid-cols-3 gap-3">
        <Field id="cf-r" label={t('calc.centrifuge.radius')} value={radius} onChange={setRadius} suffix="cm" />
        <Field id="cf-rpm" label="rpm" value={last === 'rpm' ? rpm : (computed ? String(Math.round(computed)) : '')} onChange={(v) => { setRpm(v); setLast('rpm'); }} />
        <Field id="cf-g" label="× g (RCF)" value={last === 'g' ? g : (computed ? String(Math.round(computed)) : '')} onChange={(v) => { setG(v); setLast('g'); }} />
      </div>
      {computed ? (
        <Result><strong>{last === 'rpm' ? t('calc.centrifuge.toG', { rpm: f(n(rpm), 0), g: f(computed, 0) }) : t('calc.centrifuge.toRpm', { g: f(n(g), 0), rpm: f(computed, 0) })}</strong></Result>
      ) : <p className="text-xs text-gray-500">{t('calc.centrifuge.hint')}</p>}
    </CalcCard>
  );
}

function CellsCard() {
  const { t } = useTranslation();
  const f = useFormat();
  const [counts, setCounts] = useState(['', '', '', '']);
  const [dead, setDead] = useState(['', '', '', '']);
  const [dilution, setDilution] = useState('2');
  const [perWell, setPerWell] = useState('');
  const [wells, setWells] = useState('');
  const [volWell, setVolWell] = useState('');
  const [extra, setExtra] = useState('10');
  const count = neubauer({ counts: counts.map(n).filter((x) => x !== null), dilution: n(dilution), deadCounts: dead.map(n).filter((x) => x !== null) });
  const plate = count ? plating({ cellsPerMl: count.perMl, cellsPerWell: n(perWell), wells: n(wells), volumePerWell: n(volWell), extraPercent: n(extra) ?? 0 }) : null;
  const setAt = (arr, setter, i) => (v) => setter(arr.map((x, j) => (j === i ? v : x)));
  return (
    <CalcCard icon={Microscope} title={t('calc.cells.title')} description={t('calc.cells.description')}>
      <div className="space-y-2">
        <Label className="text-xs text-gray-600">{t('calc.cells.live')}</Label>
        <div className="grid grid-cols-4 gap-2">{counts.map((c, i) => <Input key={i} inputMode="numeric" aria-label={`${t('calc.cells.live')} ${i + 1}`} value={c} onChange={(e) => setAt(counts, setCounts, i)(e.target.value)} placeholder={`Q${i + 1}`} />)}</div>
        <Label className="text-xs text-gray-600">{t('calc.cells.dead')}</Label>
        <div className="grid grid-cols-4 gap-2">{dead.map((c, i) => <Input key={i} inputMode="numeric" aria-label={`${t('calc.cells.dead')} ${i + 1}`} value={c} onChange={(e) => setAt(dead, setDead, i)(e.target.value)} placeholder={`Q${i + 1}`} />)}</div>
        <Field id="cell-dil" label={t('calc.cells.dilution')} value={dilution} onChange={setDilution} suffix="×" />
      </div>
      {count && (
        <Result>
          <p><strong>{t('calc.cells.result', { perMl: f(count.perMl, 0) })}</strong></p>
          <p>{t('calc.cells.mean', { mean: f(count.meanLive, 1), n: count.quadrants })}{count.viability !== null && <> · {t('calc.cells.viability', { v: f(count.viability, 1) })}</>}</p>
        </Result>
      )}
      <div className="border-t pt-3 space-y-2">
        <p className="text-sm font-medium">{t('calc.cells.platingTitle')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field id="pl-cells" label={t('calc.cells.perWell')} value={perWell} onChange={setPerWell} placeholder="ex.: 50000" />
          <Field id="pl-wells" label={t('calc.cells.wells')} value={wells} onChange={setWells} />
          <Field id="pl-vol" label={t('calc.cells.volumePerWell')} value={volWell} onChange={setVolWell} suffix="µL" />
          <Field id="pl-extra" label={t('calc.cells.extra')} value={extra} onChange={setExtra} suffix="%" />
        </div>
        {plate ? (
          <Result tone={plate.enough ? 'blue' : 'amber'}>
            {plate.enough ? (
              <>
                <p><strong>{t('calc.cells.platingResult', { suspension: f(plate.suspension, 1), medium: f(plate.medium, 1) })}</strong></p>
                <p>{t('calc.cells.platingTotal', { total: f(plate.totalVolume, 0), cells: f(plate.totalCells, 0) })}</p>
              </>
            ) : <p className="flex gap-1"><AlertTriangle className="h-4 w-4 shrink-0" />{t('calc.cells.notEnough')}</p>}
          </Result>
        ) : <p className="text-xs text-gray-500">{count ? t('calc.cells.platingHint') : t('calc.cells.countFirst')}</p>}
      </div>
    </CalcCard>
  );
}

function Calculators() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <C1V1Card />
      <PrimerCard />
      <SerialCard />
      <SolutionCard />
      <CellsCard />
      <CentrifugeCard />
    </div>
  );
}

export default Calculators;
