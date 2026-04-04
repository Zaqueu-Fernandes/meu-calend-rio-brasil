import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Tag } from 'lucide-react';
import { Categoria } from '@/hooks/useCategorias';

const CORES_CATEGORIA = ['#6B7280', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

interface CategoriasManagerProps {
  open: boolean;
  onClose: () => void;
  categorias: Categoria[];
  onCriar: (nome: string, cor: string) => Promise<string | null>;
  onAtualizar: (id: string, nome: string, cor: string) => void;
  onExcluir: (id: string) => void;
  onCategoriaCriada?: (id: string) => void;
}

const CategoriasManager = ({ open, onClose, categorias, onCriar, onAtualizar, onExcluir, onCategoriaCriada }: CategoriasManagerProps) => {
  const [novoNome, setNovoNome] = useState('');
  const [novaCor, setNovaCor] = useState(CORES_CATEGORIA[0]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCor, setEditCor] = useState('');

  const handleCriar = async () => {
    if (!novoNome.trim()) return;
    const newId = await onCriar(novoNome.trim(), novaCor);
    setNovoNome('');
    setNovaCor(CORES_CATEGORIA[0]);
    if (newId && onCategoriaCriada) {
      onCategoriaCriada(newId);
    }
  };

  const handleEditar = (cat: Categoria) => {
    setEditandoId(cat.id);
    setEditNome(cat.nome);
    setEditCor(cat.cor);
  };

  const handleSalvarEdicao = () => {
    if (!editandoId || !editNome.trim()) return;
    onAtualizar(editandoId, editNome.trim(), editCor);
    setEditandoId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" /> Gerenciar Categorias
          </DialogTitle>
        </DialogHeader>

        {/* Nova categoria */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              placeholder="Nome da categoria"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleCriar()}
            />
            <Button size="sm" onClick={handleCriar} className="gap-1">
              <Plus className="w-4 h-4" /> Criar
            </Button>
          </div>
          <div className="flex gap-1.5">
            {CORES_CATEGORIA.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNovaCor(c)}
                className="w-6 h-6 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  transform: novaCor === c ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: novaCor === c ? `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-2 mt-2">
          {categorias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria criada</p>
          ) : (
            categorias.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                {editandoId === cat.id ? (
                  <>
                    <Input value={editNome} onChange={e => setEditNome(e.target.value)} className="flex-1 h-8 text-sm" onKeyDown={e => e.key === 'Enter' && handleSalvarEdicao()} />
                    <div className="flex gap-1">
                      {CORES_CATEGORIA.map(c => (
                        <button key={c} type="button" onClick={() => setEditCor(c)} className="w-4 h-4 rounded-full" style={{ backgroundColor: c, outline: editCor === c ? `2px solid ${c}` : 'none', outlineOffset: '1px' }} />
                      ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={handleSalvarEdicao} className="h-8 text-xs">Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)} className="h-8 text-xs">Cancelar</Button>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                    <span className="flex-1 text-sm text-foreground">{cat.nome}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditar(cat)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onExcluir(cat.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoriasManager;
