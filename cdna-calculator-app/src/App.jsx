import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Thermometer, Settings, Plus, Edit, Trash2, Upload, Download, Copy, Save, Smartphone, Printer, ExternalLink, FlaskConical, Calculator } from 'lucide-react';
import { QPLATE_URL } from '@/lib/qplateBridge.js';
import Footer from './Footer.jsx';
import PrintableProtocol from './PrintableProtocol.jsx';
import SamplePrep from './SamplePrep.jsx';
import ExperimentHistory, { SaveExperimentDialog } from './ExperimentHistory.jsx';
import BenchMode from './BenchMode.jsx';
import Calculators from './Calculators.jsx';
import { buildExperiment, experimentSampleRows, loadHistory, mergeHistory, saveHistory, setLastOperator } from '@/lib/history.js';
import { DEFAULT_REACTION_VOLUME, DEFAULT_TARGET_MASS, calculateSamples, getFreeVolume, makeSample, parseNumber, resizeSamples } from '@/lib/samplePrep.js';
// 1. Importar o hook de tradução
import { useTranslation } from 'react-i18next';

// Kit padrão de exemplo
const defaultKit = {
  id: 'default-kit',
  name: 'Kit Genérico (Exemplo)',
  reagents: [
    { name: 'RT Buffer', volumePerReaction: 2 },
    { name: 'dNTP Mix ', volumePerReaction: 0.8 },
    { name: 'Primers', volumePerReaction: 2 },
    { name: 'Inibidor de RNase', volumePerReaction: 1 },
    { name: 'Transcriptase Reversa', volumePerReaction: 1 },
    { name: 'H2O DEPC', volumePerReaction: 3.2 },
  ],
  reactionVolume: 20,
  protocol: '1. Annealing: 25°C por 10 min\n2. Síntese: 37°C por 60 min\n3. Síntese: 37°C por 60 min (2º ciclo, total 120 min)\n4. Inativação: 85°C por 5 min\n5. Hold: 4°C',
  notes: 'Este é um kit genérico. Crie o seu próprio para protocolos específicos.'
}

// O kit padrão aparece no idioma escolhido (nome, protocolo e notas vêm das traduções)
const localizeKit = (kit, t) => kit.id === 'default-kit'
  ? { ...kit, name: t('defaultKit.name'), protocol: t('defaultKit.protocol'), notes: t('defaultKit.notes') }
  : kit

function App() {
  // 2. Inicializar o hook de tradução
  const { t, i18n } = useTranslation();

  // Estados principais
  const [kits, setKits] = useState([defaultKit])
  const [selectedKitId, setSelectedKitId] = useState('default-kit')
  // Tabela de amostras (RNA + água) — carregada do navegador já na inicialização
  const [savedSamplePrep] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('master-mix-samples'))
      if (saved && Array.isArray(saved.samples) && saved.samples.length) return saved
    } catch (error) {
      console.error("Erro ao carregar amostras do localStorage:", error)
    }
    return null
  })
  const [samples, setSamples] = useState(() => savedSamplePrep?.samples || [makeSample(0)])
  const [targetMass, setTargetMass] = useState(() => savedSamplePrep?.targetMass ?? String(DEFAULT_TARGET_MASS))
  const [numberOfSamples, setNumberOfSamples] = useState(() => savedSamplePrep?.samples.length || 1)
  const [marginType, setMarginType] = useState('extra')
  const [extraSamples, setExtraSamples] = useState(2)
  const [extraPercentage, setExtraPercentage] = useState(10)
  
  // Estados para modais
  const [isKitModalOpen, setIsKitModalOpen] = useState(false)
  const [editingKit, setEditingKit] = useState(null)
  
  // Estados para criação/edição de kit
  const [kitName, setKitName] = useState('')
  const [kitReagents, setKitReagents] = useState([{ name: '', volumePerReaction: 0 }])
  const [kitProtocol, setKitProtocol] = useState('')
  const [kitNotes, setKitNotes] = useState('')
  const [kitReactionVolume, setKitReactionVolume] = useState(DEFAULT_REACTION_VOLUME)
  
  const [copyFeedback, setCopyFeedback] = useState('');

  // Histórico de experimentos e modo bancada
  const [history, setHistory] = useState(loadHistory)
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [isBenchOpen, setIsBenchOpen] = useState(false)
  const [printExperiment, setPrintExperiment] = useState(null)
  const [toast, setToast] = useState('')
  const [view, setView] = useState(() => (window.location.hash === '#calculadoras' ? 'calculators' : 'mastermix'))

  const changeView = (next) => {
    setView(next)
    window.history.replaceState(null, '', next === 'calculators' ? '#calculadoras' : window.location.pathname)
  }
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const savedKits = localStorage.getItem('master-mix-kits')
      if (savedKits) {
        const parsedKits = JSON.parse(savedKits)
        setKits([defaultKit, ...parsedKits])
      }
    } catch (error) {
      console.error("Erro ao carregar kits do localStorage:", error)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('master-mix-samples', JSON.stringify({ samples, targetMass }))
    } catch (error) {
      console.error("Erro ao salvar amostras no localStorage:", error)
    }
  }, [samples, targetMass])

  // A tabela de amostras e o "Número de Amostras" ficam sempre sincronizados
  const handleSamplesChange = (newSamples) => {
    setSamples(newSamples)
    setNumberOfSamples(newSamples.length)
  }

  const handleNumberOfSamplesChange = (value) => {
    setNumberOfSamples(value)
    const n = parseInt(value, 10)
    if (n >= 1 && n <= 384) setSamples(prev => resizeSamples(prev, n))
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 2500)
  }

  const updateHistory = (newHistory) => {
    setHistory(newHistory)
    if (!saveHistory(newHistory)) alert(t('history.storageFull'))
  }

  // Imprimir um experimento do histórico: troca o conteúdo impresso, imprime e volta ao atual
  useEffect(() => {
    if (!printExperiment) return undefined
    const id = setTimeout(() => {
      window.print()
      setPrintExperiment(null)
    }, 50)
    return () => clearTimeout(id)
  }, [printExperiment])

  const saveKitsToStorage = (newKits) => {
    const kitsToSave = newKits.filter(kit => kit.id !== 'default-kit')
    localStorage.setItem('master-mix-kits', JSON.stringify(kitsToSave))
  }

  const selectedKit = localizeKit(kits.find(kit => kit.id === selectedKitId) || defaultKit, t)
  const freeInfo = getFreeVolume(selectedKit)

  const getMultiplicationFactor = () => {
    const numSamples = Number(numberOfSamples) || 0;
    if (marginType === 'extra') {
      return numSamples + (Number(extraSamples) || 0);
    } else {
      return numSamples * (1 + (Number(extraPercentage) || 0) / 100);
    }
  }

  const calculateTotalVolumes = () => {
    const factor = getMultiplicationFactor()
    return selectedKit.reagents.map(reagent => ({
      ...reagent,
      totalVolume: (reagent.volumePerReaction * factor).toFixed(2)
    }))
  }

  const formatReactionCount = () => {
    const f = getMultiplicationFactor()
    return Number.isInteger(f) ? String(f) : f.toFixed(1)
  }

  const handleSaveExperiment = ({ name, operator, date, includeSamples }) => {
    const experiment = buildExperiment({
      name, operator, date, includeSamples,
      kit: selectedKit,
      numberOfSamples, marginType, extraSamples, extraPercentage,
      reactionCount: formatReactionCount(),
      results: calculateTotalVolumes(),
      samples, targetMass,
    })
    setLastOperator(experiment.operator)
    updateHistory([experiment, ...history])
    setIsSaveOpen(false)
    showToast(t('history.saved'))
  }

  const deleteExperiment = (id) => {
    if (confirm(t('history.confirmDelete'))) updateHistory(history.filter(e => e.id !== id))
  }

  const importHistory = (imported) => {
    const { merged, addedCount } = mergeHistory(history, imported)
    updateHistory(merged)
    alert(t('history.importSuccess', { count: addedCount, total: imported.length }))
  }

  // Carrega um experimento salvo de volta na calculadora
  const loadExperiment = (e) => {
    if (!confirm(t('history.confirmLoad'))) return
    const existing = kits.find(k => k.id === e.kit.id)
    if (existing) {
      setSelectedKitId(existing.id)
    } else {
      const restoredKit = { ...e.kit, id: `kit-${Date.now()}`, name: `${e.kit.name} ${t('history.restoredSuffix')}` }
      const newKits = [...kits, restoredKit]
      setKits(newKits)
      saveKitsToStorage(newKits)
      setSelectedKitId(restoredKit.id)
    }
    setMarginType(e.marginType || 'extra')
    setExtraSamples(e.extraSamples ?? 0)
    setExtraPercentage(e.extraPercentage ?? 10)
    if (e.samples && e.samples.length) {
      setSamples(e.samples.map(s => ({ ...s })))
      setNumberOfSamples(e.samples.length)
      setTargetMass(e.targetMass ?? String(DEFAULT_TARGET_MASS))
    } else {
      const n = Math.max(1, e.numberOfSamples || 1)
      setNumberOfSamples(n)
      setSamples(prev => resizeSamples(prev, n))
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showToast(t('history.loaded'))
  }

  const getTotalFinalVolume = () => {
    const volumes = calculateTotalVolumes()
    return volumes.reduce((sum, reagent) => sum + parseFloat(reagent.totalVolume), 0).toFixed(2)
  }

  const openKitModal = (kit = null) => {
    if (kit) {
      setEditingKit(kit)
      setKitName(kit.name)
      setKitReagents([...kit.reagents])
      setKitProtocol(kit.protocol || '')
      setKitNotes(kit.notes || '')
      setKitReactionVolume(kit.reactionVolume ?? DEFAULT_REACTION_VOLUME)
    } else {
      setEditingKit(null)
      setKitName('')
      setKitReagents([{ name: '', volumePerReaction: 0 }])
      setKitProtocol('')
      setKitNotes('')
      setKitReactionVolume(DEFAULT_REACTION_VOLUME)
    }
    setIsKitModalOpen(true)
  }

  const addReagent = () => {
    setKitReagents([...kitReagents, { name: '', volumePerReaction: 0 }])
  }

  const updateReagent = (index, field, value) => {
    const newReagents = [...kitReagents]
    newReagents[index][field] = field === 'volumePerReaction' ? parseFloat(value) || 0 : value
    setKitReagents(newReagents)
  }

  const removeReagent = (index) => {
    if (kitReagents.length > 1) {
      setKitReagents(kitReagents.filter((_, i) => i !== index))
    }
  }

  const saveKit = () => {
    if (!kitName.trim() || kitReagents.some(r => !r.name.trim() || r.volumePerReaction <= 0)) {
      alert(t('alerts.fillAllFields'));
      return
    }
    const reactionVolume = parseNumber(kitReactionVolume)
    if (!(reactionVolume > 0)) {
      alert(t('alerts.invalidReactionVolume'));
      return
    }

    const newKit = {
      id: editingKit ? editingKit.id : `kit-${Date.now()}`,
      name: kitName,
      reagents: kitReagents.filter(r => r.name.trim()),
      protocol: kitProtocol,
      notes: kitNotes,
      reactionVolume
    }

    let newKits
    if (editingKit) {
      newKits = kits.map(kit => kit.id === editingKit.id ? newKit : kit)
    } else {
      newKits = [...kits, newKit]
    }

    setKits(newKits)
    saveKitsToStorage(newKits)
    setIsKitModalOpen(false)
  }

  const deleteKit = (kitId) => {
    if (kitId === 'default-kit') return
    
    if (confirm(t('alerts.confirmDelete'))) {
      const newKits = kits.filter(kit => kit.id !== kitId)
      setKits(newKits)
      saveKitsToStorage(newKits)
      
      if (selectedKitId === kitId) {
        setSelectedKitId('default-kit')
      }
    }
  }
  
  const handleExportKits = () => {
    const kitsToExport = kits.filter(kit => kit.id !== 'default-kit');
    if (kitsToExport.length === 0) {
      alert(t('alerts.noKitsToExport'));
      return;
    }
    const dataStr = JSON.stringify(kitsToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'master_mix_kits_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  const handleImportKits = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedKits = JSON.parse(e.target.result);
        if (!Array.isArray(importedKits)) {
          throw new Error(t('alerts.importError'));
        }
        
        const validKits = importedKits.filter(k => k.id && k.name && Array.isArray(k.reagents));
        const existingIds = new Set(kits.map(k => k.id));
        const newKits = validKits.filter(k => !existingIds.has(k.id));
        const updatedKits = [...kits, ...newKits];

        setKits(updatedKits);
        saveKitsToStorage(updatedKits);
        
        alert(t('alerts.importSuccess', { count: newKits.length, total: validKits.length }));

      } catch (error) {
        alert(t('alerts.importFileError', { message: error.message }));
      } finally {
        event.target.value = null;
      }
    };
    reader.readAsText(file);
  }

  const copyResultsToClipboard = () => {
    const factor = formatReactionCount();
    const header = `${t('results.title')} ${t('results.description', { count: factor })}\n`;
    const tableHeader = `${t('results.reagent')}\t${t('results.volumePerReaction')}\t${t('results.totalVolume')}\n`;
    const tableBody = calculateTotalVolumes().map(r => 
      `${r.name}\t${r.volumePerReaction}\t${r.totalVolume}`
    ).join('\n');
    const footer = `\n${t('results.totalFinalVolume')}\t${getTotalFinalVolume()} µL`;

    navigator.clipboard.writeText(header + tableHeader + tableBody + footer).then(() => {
      setCopyFeedback(t('buttons.copied'));
      setTimeout(() => setCopyFeedback(''), 2000);
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      setCopyFeedback(t('alerts.copyFailed'));
      setTimeout(() => setCopyFeedback(''), 2000);
    });
  }

  return (
<>
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 main-interface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('subtitle')}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button className="bg-green-700 hover:bg-green-800 text-white" onClick={() => setIsBenchOpen(true)}>
              <Smartphone className="h-4 w-4 mr-2" />
              {t('bench.open')}
            </Button>
            <Button variant="outline" asChild>
              <a href={QPLATE_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                qPlate Architect
              </a>
            </Button>
            <Button 
              variant={i18n.language.startsWith('pt') ? 'default' : 'outline'}
              onClick={() => i18n.changeLanguage('pt')}
            >
              Português
            </Button>
            <Button 
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              onClick={() => i18n.changeLanguage('en')}
            >
              English
            </Button>
          </div>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg bg-gray-200 p-1" role="tablist">
            <button type="button" role="tab" aria-selected={view === 'mastermix'} onClick={() => changeView('mastermix')}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${view === 'mastermix' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>
              <FlaskConical className="h-4 w-4" />{t('nav.mastermix')}
            </button>
            <button type="button" role="tab" aria-selected={view === 'calculators'} onClick={() => changeView('calculators')}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${view === 'calculators' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>
              <Calculator className="h-4 w-4" />{t('nav.calculators')}
            </button>
          </div>
        </div>

        {view === 'calculators' ? <Calculators /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t('settings.title')}
                </CardTitle>
                <CardDescription>
                  {t('settings.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="kit-select">{t('settings.kitLabel')}</Label>
                  <div className="flex gap-2">
                    <Select value={selectedKitId} onValueChange={setSelectedKitId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t('settings.kitLabel')} />
                      </SelectTrigger>
                      <SelectContent>
                        {kits.map(kit => (
                          <SelectItem key={kit.id} value={kit.id}>
                            {localizeKit(kit, t).name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" title={t('buttons.viewProtocol')} disabled={!selectedKit.protocol}>
                          <Thermometer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2"><Thermometer className="h-5 w-5" />{t('protocol.title')}</DialogTitle>
                          <DialogDescription>{selectedKit.name}</DialogDescription>
                        </DialogHeader>
                        <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm font-mono">{selectedKit.protocol || t('protocol.none')}</div>
                        {selectedKit.notes && (
                          <>
                            <h3 className="font-semibold mt-4">{t('protocol.notes')}:</h3>
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg whitespace-pre-wrap text-sm">{selectedKit.notes}</div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="samples">{t('settings.samplesLabel')}</Label>
                  <Input id="samples" type="number" min="1" value={numberOfSamples} max="384" onChange={(e) => handleNumberOfSamplesChange(e.target.value)} />
                </div>

                <div className="space-y-4">
                  <Label>{t('settings.safetyMarginLabel')}</Label>
                  <div className="flex items-center space-x-2"><input type="radio" id="extra" name="margin" checked={marginType === 'extra'} onChange={() => setMarginType('extra')} className="w-4 h-4" /><Label htmlFor="extra">{t('settings.extraSamples')}</Label></div>
                  {marginType === 'extra' && <Input type="number" min="0" value={extraSamples} onChange={(e) => setExtraSamples(e.target.value)} />}
                  <div className="flex items-center space-x-2"><input type="radio" id="percentage" name="margin" checked={marginType === 'percentage'} onChange={() => setMarginType('percentage')} className="w-4 h-4" /><Label htmlFor="percentage">{t('settings.extraPercentage')}</Label></div>
                  {marginType === 'percentage' && <Input type="number" min="0" max="100" value={extraPercentage} onChange={(e) => setExtraPercentage(e.target.value)} />}
                </div>

                <Button onClick={() => openKitModal()} className="w-full" variant="outline"><Plus className="h-4 w-4 mr-2" />{t('buttons.addKit')}</Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <CardTitle>{t('results.title')}</CardTitle>
                    <CardDescription>{t('results.description', { count: formatReactionCount() })}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setIsSaveOpen(true)}>
                      <Save className="h-4 w-4 mr-2" />
                      {t('history.saveTitle')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      {t('buttons.printProtocol')}
                    </Button>
                  <Button variant="outline" size="sm" onClick={copyResultsToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    {copyFeedback || t('buttons.copy')}
                  </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="text-left p-3 font-semibold">{t('results.reagent')}</th><th className="text-right p-3 font-semibold">{t('results.volumePerReaction')}</th><th className="text-right p-3 font-semibold">{t('results.totalVolume')}</th></tr></thead><tbody>{calculateTotalVolumes().map((reagent, index) => (<tr key={index} className="border-b hover:bg-gray-50"><td className="p-3">{reagent.name}</td><td className="p-3 text-right">{reagent.volumePerReaction}</td><td className="p-3 text-right font-semibold">{reagent.totalVolume}</td></tr>))}</tbody></table></div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"><div className="flex justify-between items-center"><span className="text-lg font-semibold text-blue-900">{t('results.totalFinalVolume')}</span><Badge variant="secondary" className="text-lg px-4 py-2">{getTotalFinalVolume()} µL</Badge></div></div>
              </CardContent>
            </Card>

            <SamplePrep
              samples={samples}
              onSamplesChange={handleSamplesChange}
              targetMass={targetMass}
              onTargetMassChange={setTargetMass}
              freeInfo={freeInfo}
            />

            <ExperimentHistory
              history={history}
              onDelete={deleteExperiment}
              onLoad={loadExperiment}
              onPrint={setPrintExperiment}
              onImport={importHistory}
            />

            <Card>
              <CardHeader>
                <CardTitle>{t('savedKits.title')}</CardTitle>
                <CardDescription>{t('savedKits.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Button onClick={() => fileInputRef.current.click()} variant="outline" className="flex-1"><Upload className="h-4 w-4 mr-2" />{t('buttons.import')}</Button>
                  <input type="file" ref={fileInputRef} onChange={handleImportKits} accept=".json" className="hidden" />
                  <Button onClick={handleExportKits} variant="outline" className="flex-1"><Download className="h-4 w-4 mr-2" />{t('buttons.export')}</Button>
                </div>
                <div className="space-y-2">
                  {kits.map(kit => (
                    <div key={kit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div><span className="font-medium">{localizeKit(kit, t).name}</span><span className="text-sm text-gray-500 ml-2">{t('savedKits.reagentsCount', { count: kit.reagents.length })}</span></div>
                      <div className="flex gap-2">
                        {kit.id !== 'default-kit' && (
                          <><Button variant="ghost" size="icon" onClick={() => openKitModal(kit)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteKit(kit.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        <Dialog open={isKitModalOpen} onOpenChange={setIsKitModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingKit ? t('kitModal.editTitle') : t('kitModal.createTitle')}</DialogTitle>
              <DialogDescription>{t('kitModal.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="kit-name">{t('kitModal.kitNameLabel')}</Label>
                <Input id="kit-name" value={kitName} onChange={(e) => setKitName(e.target.value)} placeholder={t('placeholders.kitName')} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('kitModal.reagentsLabel')}</Label>
                  <Button onClick={addReagent} size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />{t('buttons.addReagent')}</Button>
                </div>
                {kitReagents.map((reagent, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>{t('kitModal.reagentNameLabel')}</Label>
                      <Input value={reagent.name} onChange={(e) => updateReagent(index, 'name', e.target.value)} placeholder={t('placeholders.reagentName')} />
                    </div>
                    <div className="w-32">
                      <Label>{t('kitModal.volumeLabel')}</Label>
                      <Input type="number" step="0.1" min="0" value={reagent.volumePerReaction} onChange={(e) => updateReagent(index, 'volumePerReaction', e.target.value)} />
                    </div>
                    {kitReagents.length > 1 && (<Button variant="ghost" size="icon" onClick={() => removeReagent(index)}><Trash2 className="h-4 w-4" /></Button>)}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="kit-reaction-volume">{t('kitModal.reactionVolumeLabel')}</Label>
                <Input id="kit-reaction-volume" type="number" step="0.5" min="1" className="w-32" value={kitReactionVolume} onChange={(e) => setKitReactionVolume(e.target.value)} />
                <p className="text-xs text-gray-500">{t('kitModal.reactionVolumeHint', { mix: kitReagents.reduce((sum, r) => sum + (Number(r.volumePerReaction) || 0), 0).toFixed(2) })}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kit-protocol">{t('kitModal.protocolLabel')}</Label>
                <Textarea id="kit-protocol" value={kitProtocol} onChange={(e) => setKitProtocol(e.target.value)} rows={4} placeholder={t('placeholders.protocol')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kit-notes">{t('kitModal.notesLabel')}</Label>
                <Textarea id="kit-notes" value={kitNotes} onChange={(e) => setKitNotes(e.target.value)} rows={3} placeholder={t('placeholders.notes')} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsKitModalOpen(false)}>{t('buttons.cancel')}</Button>
                <Button onClick={saveKit}>{editingKit ? t('buttons.saveChanges') : t('buttons.createKit')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>




        <Footer />
      </div>

      {isSaveOpen && <SaveExperimentDialog
        open={isSaveOpen}
        onOpenChange={setIsSaveOpen}
        onSave={handleSaveExperiment}
        hasSamples={samples.some(s => s.concentration !== '')}
        kitName={selectedKit.name}
        reactionCount={formatReactionCount()}
      />}

      {isBenchOpen && (
        <BenchMode
          kit={selectedKit}
          results={calculateTotalVolumes()}
          reactionCount={formatReactionCount()}
          sampleRows={calculateSamples(samples, parseNumber(targetMass), freeInfo.freeVolume)}
          freeInfo={freeInfo}
          targetMass={targetMass}
          onExit={() => setIsBenchOpen(false)}
          onSave={() => setIsSaveOpen(true)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-gray-900 text-white px-5 py-3 text-sm shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>

    {printExperiment ? (
      <PrintableProtocol
        kit={printExperiment.kit}
        results={printExperiment.results}
        reactionCount={printExperiment.reactionCount}
        sampleRows={experimentSampleRows(printExperiment)}
        targetMass={printExperiment.targetMass}
        freeInfo={getFreeVolume(printExperiment.kit)}
        meta={printExperiment}
      />
    ) : (
      <PrintableProtocol
        kit={selectedKit}
        results={calculateTotalVolumes()}
        reactionCount={formatReactionCount()}
        sampleRows={calculateSamples(samples, parseNumber(targetMass), freeInfo.freeVolume)}
        targetMass={targetMass}
        freeInfo={freeInfo}
      />
    )}
</>
  )
}

export default App;