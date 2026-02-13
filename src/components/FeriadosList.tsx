import { Feriado } from '@/lib/feriados';
import { Card, CardContent } from '@/components/ui/card';
import { Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MESES } from '@/lib/calendario';

interface FeriadosListProps {
  feriados: Feriado[];
  ano: number;
}

const FeriadosList = ({ feriados, ano }: FeriadosListProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Flag className="w-4 h-4" /> Feriados {ano}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feriados Nacionais - {ano}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {feriados.map((f, i) => (
            <Card key={i} className="border-l-4 border-l-destructive">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-card-foreground">{f.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {f.data.getDate()} de {MESES[f.data.getMonth()]}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {f.tipo}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeriadosList;
