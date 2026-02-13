import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CORES = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

interface EventoFormProps {
  open: boolean;
  onClose: () => void;
  dataSelecionada: Date;
  onSalvar: (evento: { titulo: string; descricao?: string; data: string; horario?: string; cor: string }) => void;
}

const EventoForm = ({ open, onClose, dataSelecionada, onSalvar }: EventoFormProps) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horario, setHorario] = useState('');
  const [cor, setCor] = useState(CORES[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar({
      titulo,
      descricao: descricao || undefined,
      data: dataSelecionada.toISOString().split('T')[0],
      horario: horario || undefined,
      cor,
    });
    setTitulo('');
    setDescricao('');
    setHorario('');
    setCor(CORES[0]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome do evento"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes (opcional)"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="horario">Horário</Label>
            <Input
              id="horario"
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />
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
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventoForm;
