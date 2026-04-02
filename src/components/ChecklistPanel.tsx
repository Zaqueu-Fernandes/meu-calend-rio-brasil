import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X } from 'lucide-react';
import { ChecklistItem } from '@/hooks/useChecklist';

interface ChecklistPanelProps {
  items: ChecklistItem[];
  loading: boolean;
  onAdicionar: (texto: string) => void;
  onToggle: (id: string, concluido: boolean) => void;
  onRemover: (id: string) => void;
}

const ChecklistPanel = ({ items, loading, onAdicionar, onToggle, onRemover }: ChecklistPanelProps) => {
  const [novoTexto, setNovoTexto] = useState('');

  const handleAdicionar = () => {
    if (!novoTexto.trim()) return;
    onAdicionar(novoTexto.trim());
    setNovoTexto('');
  };

  const concluidos = items.filter(i => i.concluido).length;
  const total = items.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Checklist</span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">{concluidos}/{total}</span>
        )}
      </div>

      {total > 0 && (
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${total > 0 ? (concluidos / total) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 group">
            <Checkbox
              checked={item.concluido}
              onCheckedChange={(checked) => onToggle(item.id, !!checked)}
            />
            <span className={`flex-1 text-sm ${item.concluido ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {item.texto}
            </span>
            <button
              onClick={() => onRemover(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={novoTexto}
          onChange={e => setNovoTexto(e.target.value)}
          placeholder="Novo item..."
          className="h-8 text-sm"
          onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
        />
        <Button size="sm" variant="outline" onClick={handleAdicionar} className="h-8 shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default ChecklistPanel;
