import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paperclip, AlarmClock, X, Tag, Plus } from 'lucide-react';
import { Evento } from '@/hooks/useEventos';
import { Categoria } from '@/hooks/useCategorias';
import { requestAlarmNotificationPermission, unlockAlarmAudio } from '@/lib/alarmCapabilities';

const CORES = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

interface EventoFormProps {
  open: boolean;
  onClose: () => void;
  dataSelecionada: Date;
  onSalvar: (evento: { titulo: string; descricao?: string; data: string; horario?: string; cor: string; anexo_url?: string; alarme?: string; categoria_id?: string }) => void;
  onAtualizar?: (id: string, evento: Partial<Evento>) => void;
  onUploadAnexo?: (file: File) => Promise<string | null>;
  eventoParaEditar?: Evento | null;
  categorias?: Categoria[];
  onAbrirCategorias?: () => void;
  categoriaPendente?: string | null;
  onCategoriaPendenteConsumed?: () => void;
}

const EventoForm = ({ open, onClose, dataSelecionada, onSalvar, onAtualizar, onUploadAnexo, eventoParaEditar, categorias = [], onAbrirCategorias, categoriaPendente, onCategoriaPendenteConsumed }: EventoFormProps) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [horario, setHorario] = useState('');
  const [cor, setCor] = useState(CORES[0]);
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [anexoUrl, setAnexoUrl] = useState<string | null>(null);
  const [alarmeData, setAlarmeData] = useState('');
  const [alarmeHora, setAlarmeHora] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('none');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!eventoParaEditar;

  useEffect(() => {
    if (eventoParaEditar) {
      setTitulo(eventoParaEditar.titulo);
      setDescricao(eventoParaEditar.descricao || '');
      setHorario(eventoParaEditar.horario || '');
      setCor(eventoParaEditar.cor);
      setAnexoUrl(eventoParaEditar.anexo_url);
      setCategoriaId((eventoParaEditar as any).categoria_id || 'none');
      if (eventoParaEditar.alarme) {
        const d = new Date(eventoParaEditar.alarme);
        setAlarmeData(d.toISOString().split('T')[0]);
        setAlarmeHora(d.toTimeString().slice(0, 5));
      } else {
        setAlarmeData('');
        setAlarmeHora('');
      }
    } else {
      resetForm();
    }
  }, [eventoParaEditar, open]);

  useEffect(() => {
    if (categoriaPendente && open) {
      setCategoriaId(categoriaPendente);
      onCategoriaPendenteConsumed?.();
    }
  }, [categoriaPendente, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalAnexoUrl = anexoUrl;
    if (anexoFile && onUploadAnexo) {
      finalAnexoUrl = await onUploadAnexo(anexoFile);
    }

    let alarme: string | undefined;
    if (alarmeData && alarmeHora) {
      await unlockAlarmAudio();
      await requestAlarmNotificationPermission();
      alarme = new Date(`${alarmeData}T${alarmeHora}`).toISOString();
    }

    const catId = categoriaId === 'none' ? undefined : categoriaId;

    if (isEditing && onAtualizar && eventoParaEditar) {
      onAtualizar(eventoParaEditar.id, {
        titulo,
        descricao: descricao || null,
        horario: horario || null,
        cor,
        anexo_url: finalAnexoUrl,
        alarme: alarme || null,
        categoria_id: catId || null,
      } as any);
    } else {
      onSalvar({
        titulo,
        descricao: descricao || undefined,
        data: dataSelecionada.toISOString().split('T')[0],
        horario: horario || undefined,
        cor,
        anexo_url: finalAnexoUrl || undefined,
        alarme,
        categoria_id: catId,
      });
    }

    setUploading(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setHorario('');
    setCor(CORES[0]);
    setAnexoFile(null);
    setAnexoUrl(null);
    setAlarmeData('');
    setAlarmeHora('');
    setCategoriaId('none');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      setAnexoFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome do evento" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes (opcional)" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="horario">Horário</Label>
            <Input id="horario" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Tag className="w-4 h-4" /> Categoria</Label>
            {categorias.length > 0 ? (
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
            )}
            {onAbrirCategorias && (
              <Button type="button" size="sm" className="gap-1 w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={onAbrirCategorias}>
                <Plus className="w-4 h-4" /> Nova Categoria
              </Button>
            )}
          </div>

          {/* Anexo */}
          <div className="space-y-2">
            <Label>Anexar Arquivo</Label>
            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-4 h-4" /> Escolher arquivo
              </Button>
              {(anexoFile || anexoUrl) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="truncate max-w-[150px]">{anexoFile?.name || 'Arquivo anexado'}</span>
                  <button type="button" onClick={() => { setAnexoFile(null); setAnexoUrl(null); }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Alarme */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><AlarmClock className="w-4 h-4" /> Despertador</Label>
            <div className="flex gap-2">
              <Input type="date" value={alarmeData} onChange={(e) => setAlarmeData(e.target.value)} className="flex-1" />
              <Input type="time" value={alarmeHora} onChange={(e) => setAlarmeHora(e.target.value)} className="flex-1" />
            </div>
            {alarmeData && alarmeHora && (
              <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { setAlarmeData(''); setAlarmeHora(''); }}>
                Remover alarme
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {CORES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="w-8 h-8 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: cor === c ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: cor === c ? '0 0 0 3px hsl(var(--background)), 0 0 0 5px ' + c : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Enviando...' : isEditing ? 'Salvar Alterações' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventoForm;
