import { useState, useEffect, useRef } from 'react' // --- ALTERADO ---: Adicionado useRef
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
// --- NOVO ---: Adicionado novos ícones
import { Thermometer, Settings, Plus, Edit, Trash2, Info, Upload, Download, Copy } from 'lucide-react' 
import Footer from './Footer.jsx';


// Kit padrão de exemplo
const defaultKit = {
  id: 'default-kit',
  name: 'Kit Genérico (Exemplo)',
  reagents: [
    { name: 'Buffer de Reação 5X', volumePerReaction: 4 },
    { name: 'dNTP Mix (10 mM)', volumePerReaction: 1 },
    { name: 'Inibidor de RNase', volumePerReaction: 0.5 },
    { name: 'Transcriptase Reversa', volumePerReaction: 1 }
  ],
  protocol: '1. Annealing: 65°C por 5 min\n2. Síntese: 50°C por 50 min\n3. Inativação: 85°C por 5 min',
  notes: 'Este é um kit genérico. Crie o seu próprio para protocolos específicos.' // --- NOVO ---
}

function App() {
  // Estados principais
  const [kits, setKits] = useState([defaultKit])
  const [selectedKitId, setSelectedKitId] = useState('default-kit')
  const [numberOfSamples, setNumberOfSamples] = useState(1)
  const [marginType, setMarginType] = useState('extra')
  const [extraSamples, setExtraSamples] = useState(1)
  const [extraPercentage, setExtraPercentage] = useState(10)
  
  // Estados para modais
  const [isKitModalOpen, setIsKitModalOpen] = useState(false)
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false)
  const [editingKit, setEditingKit] = useState(null)
  
  // Estados para criação/edição de kit
  const [kitName, setKitName] = useState('')
  const [kitReagents, setKitReagents] = useState([{ name: '', volumePerReaction: 0 }])
  const [kitProtocol, setKitProtocol] = useState('')
  const [kitNotes, setKitNotes] = useState('') // --- NOVO ---
  
  // --- NOVO ---: Estado para feedback de cópia e ref para input de arquivo
  const [copyFeedback, setCopyFeedback] = useState('');
  const fileInputRef = useRef(null);


  // Carregar kits do localStorage
  useEffect(() => {
    try {
      const savedKits = localStorage.getItem('cdna-kits')
      if (savedKits) {
        const parsedKits = JSON.parse(savedKits)
        setKits([defaultKit, ...parsedKits])
      }
    } catch (error) {
      console.error("Erro ao carregar kits do localStorage:", error)
    }
  }, [])

  // Salvar kits no localStorage
  const saveKitsToStorage = (newKits) => {
    const kitsToSave = newKits.filter(kit => kit.id !== 'default-kit')
    localStorage.setItem('cdna-kits', JSON.stringify(kitsToSave))
  }

  // Obter kit selecionado
  const selectedKit = kits.find(kit => kit.id === selectedKitId) || defaultKit

  // Calcular fator de multiplicação
  const getMultiplicationFactor = () => {
    const numSamples = Number(numberOfSamples) || 0;
    if (marginType === 'extra') {
      return numSamples + (Number(extraSamples) || 0);
    } else {
      return numSamples * (1 + (Number(extraPercentage) || 0) / 100);
    }
  }

  // Calcular volumes totais
  const calculateTotalVolumes = () => {
    const factor = getMultiplicationFactor()
    return selectedKit.reagents.map(reagent => ({
      ...reagent,
      totalVolume: (reagent.volumePerReaction * factor).toFixed(2)
    }))
  }

  // Calcular volume final total
  const getTotalFinalVolume = () => {
    const volumes = calculateTotalVolumes()
    return volumes.reduce((sum, reagent) => sum + parseFloat(reagent.totalVolume), 0).toFixed(2)
  }

  // Funções para gerenciamento de kits
  const openKitModal = (kit = null) => {
    if (kit) {
      setEditingKit(kit)
      setKitName(kit.name)
      setKitReagents([...kit.reagents])
      setKitProtocol(kit.protocol || '')
      setKitNotes(kit.notes || '') // --- NOVO ---
    } else {
      setEditingKit(null)
      setKitName('')
      setKitReagents([{ name: '', volumePerReaction: 0 }])
      setKitProtocol('')
      setKitNotes('') // --- NOVO ---
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
    if (!kitName.trim() || kitReagents.some(r => !r.name.trim())) {
      alert('Por favor, preencha o nome do kit e o nome de todos os reagentes.')
      return
    }

    const newKit = {
      id: editingKit ? editingKit.id : `kit-${Date.now()}`,
      name: kitName,
      reagents: kitReagents.filter(r => r.name.trim()),
      protocol: kitProtocol,
      notes: kitNotes // --- NOVO ---
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
    
    if (confirm('Tem certeza que deseja excluir este kit?')) {
      const newKits = kits.filter(kit => kit.id !== kitId)
      setKits(newKits)
      saveKitsToStorage(newKits)
      
      if (selectedKitId === kitId) {
        setSelectedKitId('default-kit')
      }
    }
  }
  
  // --- NOVO: Funções de Importar/Exportar ---
  const handleExportKits = () => {
    const kitsToExport = kits.filter(kit => kit.id !== 'default-kit');
    if (kitsToExport.length === 0) {
      alert("Não há kits personalizados para exportar.");
      return;
    }
    const dataStr = JSON.stringify(kitsToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'cdna_kits_backup.json';
    
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
          throw new Error("O arquivo não contém uma lista de kits válida.");
        }
        
        // Simples validação da estrutura do kit importado
        const validKits = importedKits.filter(k => k.id && k.name && Array.isArray(k.reagents));

        const existingIds = new Set(kits.map(k => k.id));
        const newKits = validKits.filter(k => !existingIds.has(k.id));
        
        const updatedKits = [...kits, ...newKits];
        setKits(updatedKits);
        saveKitsToStorage(updatedKits);
        
        alert(`${newKits.length} de ${validKits.length} kits foram importados com sucesso! Kits duplicados foram ignorados.`);

      } catch (error) {
        alert(`Erro ao importar o arquivo: ${error.message}`);
      } finally {
        // Limpa o valor do input para permitir a importação do mesmo arquivo novamente
        event.target.value = null;
      }
    };
    reader.readAsText(file);
  }

  // --- NOVO: Função para Copiar Resultados ---
  const copyResultsToClipboard = () => {
    const factor = getMultiplicationFactor().toFixed(1);
    const header = `Resultados do Master Mix para ${factor} reações\n`;
    const tableHeader = `Reagente\tVolume/Reação (µL)\tVolume Total (µL)\n`;
    const tableBody = calculateTotalVolumes().map(r => 
      `${r.name}\t${r.volumePerReaction}\t${r.totalVolume}`
    ).join('\n');
    const footer = `\nVolume Total Final:\t${getTotalFinalVolume()} µL`;

    const textToCopy = header + tableHeader + tableBody + footer;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyFeedback('Copiado!');
      setTimeout(() => setCopyFeedback(''), 2000);
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      setCopyFeedback('Falha ao copiar');
      setTimeout(() => setCopyFeedback(''), 2000);
    });
  }


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Master Mix Calculator
          </h1>
          <p className="text-lg text-gray-600">
            Ferramenta profissional para cálculo de Master Mix
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Controle */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações
                </CardTitle>
                <CardDescription>
                  Configure seu kit e parâmetros de reação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seleção de Kit */}
                <div className="space-y-2">
                  <Label htmlFor="kit-select">Kit de cDNA</Label>
                  <div className="flex gap-2">
                    <Select value={selectedKitId} onValueChange={setSelectedKitId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um kit" />
                      </SelectTrigger>
                      <SelectContent>
                        {kits.map(kit => (
                          <SelectItem key={kit.id} value={kit.id}>
                            {kit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" title="Ver protocolo do termociclador" disabled={!selectedKit.protocol}>
                            <Thermometer className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                           <DialogHeader>
                              <DialogTitle className="flex items-center gap-2"><Thermometer className="h-5 w-5" />Protocolo do Termociclador</DialogTitle>
                              <DialogDescription>{selectedKit.name}</DialogDescription>
                            </DialogHeader>
                            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm font-mono">{selectedKit.protocol || 'Nenhum protocolo definido.'}</div>
                            {selectedKit.notes && (
                              <>
                                <h3 className="font-semibold mt-4">Notas Adicionais:</h3>
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg whitespace-pre-wrap text-sm">{selectedKit.notes}</div>
                              </>
                            )}
                        </DialogContent>
                      </Dialog>
                  </div>
                </div>

                {/* Número de Amostras */}
                <div className="space-y-2">
                  <Label htmlFor="samples">Número de Amostras</Label>
                  <Input id="samples" type="number" min="1" value={numberOfSamples} onChange={(e) => setNumberOfSamples(e.target.value)} />
                </div>

                {/* Margem de Segurança */}
                <div className="space-y-4">
                  <Label>Margem de Segurança</Label>
                  <div className="flex items-center space-x-2"><input type="radio" id="extra" name="margin" checked={marginType === 'extra'} onChange={() => setMarginType('extra')} className="w-4 h-4" /><Label htmlFor="extra">Amostras Extras</Label></div>
                  {marginType === 'extra' && <Input type="number" min="0" value={extraSamples} onChange={(e) => setExtraSamples(e.target.value)} placeholder="Número de amostras extras" />}
                  <div className="flex items-center space-x-2"><input type="radio" id="percentage" name="margin" checked={marginType === 'percentage'} onChange={() => setMarginType('percentage')} className="w-4 h-4" /><Label htmlFor="percentage">Porcentagem Extra (%)</Label></div>
                  {marginType === 'percentage' && <Input type="number" min="0" max="100" value={extraPercentage} onChange={(e) => setExtraPercentage(e.target.value)} placeholder="Porcentagem extra" />}
                </div>

                {/* Botão Gerenciar Kits */}
                <Button onClick={() => openKitModal()} className="w-full" variant="outline"><Plus className="h-4 w-4 mr-2" />Adicionar Novo Kit</Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Resultados do Master Mix</CardTitle>
                    <CardDescription>Volumes calculados para {getMultiplicationFactor().toFixed(1)} reações</CardDescription>
                  </div>
                  {/* --- NOVO: Botão de Copiar --- */}
                  <Button variant="outline" size="sm" onClick={copyResultsToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    {copyFeedback || 'Copiar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="text-left p-3 font-semibold">Reagente</th><th className="text-right p-3 font-semibold">Volume/Reação (µL)</th><th className="text-right p-3 font-semibold">Volume Total (µL)</th></tr></thead><tbody>{calculateTotalVolumes().map((reagent, index) => (<tr key={index} className="border-b hover:bg-gray-50"><td className="p-3">{reagent.name}</td><td className="p-3 text-right">{reagent.volumePerReaction}</td><td className="p-3 text-right font-semibold">{reagent.totalVolume}</td></tr>))}</tbody></table></div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"><div className="flex justify-between items-center"><span className="text-lg font-semibold text-blue-900">Volume Total Final:</span><Badge variant="secondary" className="text-lg px-4 py-2">{getTotalFinalVolume()} µL</Badge></div></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kits Salvos</CardTitle>
                <CardDescription>Gerencie, importe ou exporte seus kits personalizados</CardDescription>
              </CardHeader>
              <CardContent>
                {/* --- NOVO: Botões de Importar/Exportar --- */}
                <div className="flex gap-2 mb-4">
                  <Button onClick={() => fileInputRef.current.click()} variant="outline" className="flex-1"><Upload className="h-4 w-4 mr-2" />Importar Kits (.json)</Button>
                  <input type="file" ref={fileInputRef} onChange={handleImportKits} accept=".json" className="hidden" />
                  <Button onClick={handleExportKits} variant="outline" className="flex-1"><Download className="h-4 w-4 mr-2" />Exportar Kits (.json)</Button>
                </div>
                <div className="space-y-2">
                  {kits.map(kit => (
                    <div key={kit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div><span className="font-medium">{kit.name}</span><span className="text-sm text-gray-500 ml-2">({kit.reagents.length} reagentes)</span></div>
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

        {/* Modal de Criação/Edição de Kit */}
        <Dialog open={isKitModalOpen} onOpenChange={setIsKitModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingKit ? 'Editar Kit' : 'Criar Novo Kit'}</DialogTitle><DialogDescription>Configure os reagentes, protocolo e notas do seu kit de cDNA</DialogDescription></DialogHeader><div className="space-y-6 pt-4">
            <div className="space-y-2"><Label htmlFor="kit-name">Nome do Kit</Label><Input id="kit-name" value={kitName} onChange={(e) => setKitName(e.target.value)} placeholder="Ex: SuperScript IV VILO" /></div>
            <div className="space-y-4"><div className="flex items-center justify-between"><Label>Reagentes</Label><Button onClick={addReagent} size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Adicionar Reagente</Button></div>{kitReagents.map((reagent, index) => (<div key={index} className="flex gap-2 items-end"><div className="flex-1"><Label>Nome do Reagente</Label><Input value={reagent.name} onChange={(e) => updateReagent(index, 'name', e.target.value)} placeholder="Ex: Buffer de Reação 5X" /></div><div className="w-32"><Label>Volume (µL)</Label><Input type="number" step="0.1" min="0" value={reagent.volumePerReaction} onChange={(e) => updateReagent(index, 'volumePerReaction', e.target.value)} /></div>{kitReagents.length > 1 && (<Button variant="ghost" size="icon" onClick={() => removeReagent(index)}><Trash2 className="h-4 w-4" /></Button>)}</div>))}</div>
            {/* --- ALTERADO: Adicionado campo de Notas --- */}
            <div className="space-y-2"><Label htmlFor="kit-protocol">Protocolo do Termociclador (Opcional)</Label><Textarea id="kit-protocol" value={kitProtocol} onChange={(e) => setKitProtocol(e.target.value)} placeholder="Ex: 1. Annealing: 65°C por 5 min&#10;2. Síntese: 50°C por 50 min" rows={4} /></div>
            <div className="space-y-2"><Label htmlFor="kit-notes">Notas (Opcional)</Label><Textarea id="kit-notes" value={kitNotes} onChange={(e) => setKitNotes(e.target.value)} placeholder="Ex: Lote #12345, Válido até 12/2025. Manter enzima no gelo." rows={3} /></div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setIsKitModalOpen(false)}>Cancelar</Button><Button onClick={saveKit}>{editingKit ? 'Salvar Alterações' : 'Criar Kit'}</Button></div>
          </div></DialogContent>
        </Dialog>

            <Footer />
      </div>
    </div>
  )
}

export default App