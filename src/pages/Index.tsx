import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEventos, Evento } from '@/hooks/useEventos';
import { useAlarmes } from '@/hooks/useAlarmes';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useCategorias } from '@/hooks/useCategorias';
import { getFeriadosBrasileiros } from '@/lib/feriados';
import { MESES } from '@/lib/calendario';
import CalendarioGrid from '@/components/CalendarioGrid';
import DetalhesDia from '@/components/DetalhesDia';
import EventoForm from '@/components/EventoForm';
import FeriadosList from '@/components/FeriadosList';
import MeusEventos from '@/components/MeusEventos';
import CategoriasManager from '@/components/CategoriasManager';
import { Button } from '@/components/ui/button';
import PwaInstallBanner from '@/components/PwaInstallBanner';
import AlarmeOverlay from '@/components/AlarmeOverlay';
import { ChevronLeft, ChevronRight, LogOut, Calendar, ShieldCheck, Tag, Menu, Flag, CalendarSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(hoje);
  const [formAberto, setFormAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [categoriasOpen, setCategoriasOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feriadosOpen, setFeriadosOpen] = useState(false);
  const [meusEventosOpen, setMeusEventosOpen] = useState(false);

  const { eventos, criarEvento, atualizarEvento, excluirEvento, uploadAnexo } = useEventos(mesAtual, anoAtual);
  const { categorias, criarCategoria, atualizarCategoria, excluirCategoria } = useCategorias();
  const { alarmesAtivos, dismissAlarme, dismissAll } = useAlarmes(eventos);
  usePushSubscription();
  const feriados = useMemo(() => getFeriadosBrasileiros(anoAtual), [anoAtual]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

  if (!user) return null;

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

  const handleEditarEvento = (evento: Evento) => {
    setEventoEditando(evento);
    setFormAberto(true);
  };

  const handleDuplicarEvento = async (evento: Evento) => {
    await criarEvento({
      titulo: `${evento.titulo} (cópia)`,
      descricao: evento.descricao || undefined,
      data: evento.data,
      horario: evento.horario || undefined,
      cor: evento.cor,
      anexo_url: evento.anexo_url || undefined,
      alarme: evento.alarme || undefined,
      categoria_id: evento.categoria_id || undefined,
    });
  };

  const handleAbrirEvento = (evento: Evento) => {
    const [ano, mes] = evento.data.split('-').map(Number);
    setAnoAtual(ano);
    setMesAtual(mes - 1);
    setDiaSelecionado(new Date(ano, mes - 1, Number(evento.data.split('-')[2])));
  };

  const handleCloseForm = () => {
    setFormAberto(false);
    setEventoEditando(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: hamburger (mobile) */}
          <div className="flex items-center sm:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11">
                  <Menu className="w-7 h-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> ZakCalendario
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  <Button variant="outline" className="justify-start gap-3" onClick={() => { setMenuOpen(false); setFeriadosOpen(true); }}>
                    <Flag className="w-4 h-4" /> Feriados {anoAtual}
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => { setMenuOpen(false); setMeusEventosOpen(true); }}>
                    <CalendarSearch className="w-4 h-4" /> Meus Eventos
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => { setMenuOpen(false); setCategoriasOpen(true); }}>
                    <Tag className="w-4 h-4" /> Categorias
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => { setMenuOpen(false); setSecurityOpen(true); }}>
                    <ShieldCheck className="w-4 h-4" /> Segurança
                  </Button>
                  <hr className="my-2 border-border" />
                  <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" onClick={() => { setMenuOpen(false); signOut(); }}>
                    <LogOut className="w-4 h-4" /> Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <FeriadosList feriados={feriados} ano={anoAtual} open={feriadosOpen} onOpenChange={setFeriadosOpen} hideTrigger />
            <MeusEventos categorias={categorias} onAbrirEvento={handleAbrirEvento} open={meusEventosOpen} onOpenChange={setMeusEventosOpen} hideTrigger />
          </div>

          {/* Center: app icon + name */}
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">ZakCalendario</h1>
          </div>

          {/* Right: desktop buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <FeriadosList feriados={feriados} ano={anoAtual} open={feriadosOpen} onOpenChange={setFeriadosOpen} />
            <MeusEventos categorias={categorias} onAbrirEvento={handleAbrirEvento} open={meusEventosOpen} onOpenChange={setMeusEventosOpen} />
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setCategoriasOpen(true)}>
              <Tag className="w-4 h-4" /> Categorias
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setSecurityOpen(true)}>
              <ShieldCheck className="w-4 h-4" /> Segurança
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>

          {/* Spacer for mobile to balance hamburger */}
          <div className="w-11 sm:hidden" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border-2 border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={mesAnterior}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">{MESES[mesAtual]}</h2>
                  <p className="text-sm text-muted-foreground">{anoAtual}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={mesSeguinte}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={irParaHoje} className="mb-4 w-full">Ir para Hoje</Button>
              <CalendarioGrid ano={anoAtual} mes={mesAtual} feriados={feriados} eventos={eventos} diaSelecionado={diaSelecionado} onSelectDia={setDiaSelecionado} />
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
                  categorias={categorias}
                  onNovoEvento={() => { setEventoEditando(null); setFormAberto(true); }}
                  onExcluirEvento={excluirEvento}
                  onEditarEvento={handleEditarEvento}
                  onDuplicarEvento={handleDuplicarEvento}
                  onMeusEventos={() => setMeusEventosOpen(true)}
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
          onClose={handleCloseForm}
          dataSelecionada={diaSelecionado}
          onSalvar={criarEvento}
          onAtualizar={atualizarEvento}
          onUploadAnexo={uploadAnexo}
          eventoParaEditar={eventoEditando}
          categorias={categorias}
          onAbrirCategorias={() => setCategoriasOpen(true)}
        />
      )}

      {/* Categorias Manager */}
      <CategoriasManager
        open={categoriasOpen}
        onClose={() => setCategoriasOpen(false)}
        categorias={categorias}
        onCriar={criarCategoria}
        onAtualizar={atualizarCategoria}
        onExcluir={excluirCategoria}
      />

      {/* Security Dialog */}
      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Segurança do App
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              'Autenticação protegida com criptografia',
              'Dados isolados por usuário (RLS ativo)',
              'Conexão HTTPS segura',
              'Arquivos protegidos por política de acesso',
              'Senhas nunca armazenadas em texto puro',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">
              Seu calendário está protegido com as melhores práticas de segurança.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <PwaInstallBanner />
      <AlarmeOverlay alarmesAtivos={alarmesAtivos} onDismiss={dismissAlarme} onDismissAll={dismissAll} />
    </div>
  );
};

export default Index;
