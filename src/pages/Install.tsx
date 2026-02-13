import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Smartphone, Monitor, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const Install = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Calendário
          </Button>
        </Link>

        <div className="text-center mb-8">
          <Download className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Instalar MeuCalendário</h1>
          <p className="text-muted-foreground text-lg">
            Instale o app direto no seu celular ou computador!
          </p>
        </div>

        <div className="space-y-4">
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Android (Chrome)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>1. Abra o site no <strong>Google Chrome</strong></p>
              <p>2. Toque no menu <strong>⋮</strong> (três pontos)</p>
              <p>3. Selecione <strong>"Adicionar à tela inicial"</strong></p>
              <p>4. Confirme tocando em <strong>"Adicionar"</strong></p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                iPhone / iPad (Safari)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>1. Abra o site no <strong>Safari</strong></p>
              <p>2. Toque no botão <strong>Compartilhar</strong> (ícone ↑)</p>
              <p>3. Role e selecione <strong>"Adicionar à Tela de Início"</strong></p>
              <p>4. Toque em <strong>"Adicionar"</strong></p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                Desktop (Chrome/Edge)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>1. Abra o site no <strong>Chrome</strong> ou <strong>Edge</strong></p>
              <p>2. Clique no ícone de <strong>instalação</strong> na barra de endereço</p>
              <p>3. Confirme clicando em <strong>"Instalar"</strong></p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Globe className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-card-foreground">Dica</p>
                <p className="text-sm text-muted-foreground">
                  O MeuCalendário é um PWA (Progressive Web App). Funciona como um app nativo, 
                  direto do navegador, sem precisar de lojas de aplicativos!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Install;
