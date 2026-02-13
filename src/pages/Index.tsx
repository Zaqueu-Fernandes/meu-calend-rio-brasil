import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEventos } from '@/hooks/useEventos';
import { getFeriadosBrasileiros } from '@/lib/feriados';
import { MESES } from '@/lib/calendario';
import CalendarioGrid from '@/components/CalendarioGrid';
import DetalhesDia from '@/components/DetalhesDia';
import EventoForm from '@/components/EventoForm';
import FeriadosList from '@/components/FeriadosList';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LogOut, Calendar, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(hoje);
  const [formAberto, setFormAberto] = useState(false);

  const { eventos, criarEvento, excluirEvento } = useEventos(mesAtual, anoAtual);
  const feriados = useMemo(() => getFeriadosBrasileiros(anoAtual), [anoAtual]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const mesAnterior = () => {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1); }
    else setMesAtual(m => m - 1);
    setDiaSelecionado(null);
  };

  const mesSeguinte = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1); }
    else setMesAtual(m => m + 1);
    setDiaSelecionado(null);
  };

  const irParaHoje = () => {
    setMesAtual(hoje.getMonth());
    setAnoAtual(hoje.getFullYear());
    setDiaSelecionado(hoje);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground hidden sm:block">MeuCalendário</h1>
          </div>
          <div className="flex items-center gap-2">
            <FeriadosList feriados={feriados} ano={anoAtual} />
            <Link to="/install">
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Instalar</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border-2 border-border p-4 shadow-sm"
            >
              {/* Navegação do mês */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={mesAnterior}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">
                    {MESES[mesAtual]}
                  </h2>
                  <p className="text-sm text-muted-foreground">{anoAtual}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={mesSeguinte}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={irParaHoje}
                className="mb-4 w-full"
              >
                Ir para Hoje
              </Button>

              <CalendarioGrid
                ano={anoAtual}
                mes={mesAtual}
                feriados={feriados}
                eventos={eventos}
                diaSelecionado={diaSelecionado}
                onSelectDia={setDiaSelecionado}
              />
            </motion.div>
          </div>

          {/* Painel de detalhes */}
          <div className="lg:col-span-1">
            {diaSelecionado ? (
              <div className="bg-card rounded-2xl border-2 border-border p-4 shadow-sm sticky top-20">
                <DetalhesDia
                  data={diaSelecionado}
                  feriados={feriados}
                  eventos={eventos}
                  onNovoEvento={() => setFormAberto(true)}
                  onExcluirEvento={excluirEvento}
                />
              </div>
            ) : (
              <div className="bg-card rounded-2xl border-2 border-border p-8 shadow-sm text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Selecione um dia para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Form de evento */}
      {diaSelecionado && (
        <EventoForm
          open={formAberto}
          onClose={() => setFormAberto(false)}
          dataSelecionada={diaSelecionado}
          onSalvar={criarEvento}
        />
      )}
    </div>
  );
};

export default Index;
