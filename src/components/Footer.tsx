import { MessageCircle } from 'lucide-react';

const Footer = () => {
  const whatsappNumber = '5588994014262';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <footer className="w-full py-6 px-4 mt-8 border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Copyright © 2026 | Zaqueu Fernandes | Suporte Técnico
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp: 88 9 9401-4262
        </a>
      </div>
    </footer>
  );
};

export default Footer;
