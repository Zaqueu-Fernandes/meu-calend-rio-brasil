import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Calendar, LogIn, UserPlus, Phone } from 'lucide-react'; // Adicionado ícone Phone
import InputMask from 'react-input-mask';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState(''); // Novo estado para o telefone
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lógica de Validação do Telefone (apenas no cadastro)
    if (!isLogin) {
      const numericPhone = phone.replace(/\D/g, ''); // Remove ( ) - e espaços
      
      // Validação: DDD (2 dígitos) + o próximo deve ser 9 + restante
      // O numericPhone[2] é o terceiro caractere da string (o primeiro após o DDD)
      if (numericPhone.length < 11 || numericPhone[2] !== '9') {
        toast({
          title: 'Telefone inválido',
          description: 'O número deve ter o formato (XX) 9XXXX-XXXX',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              nome: displayName,
              telefone: phone // Enviando o telefone formatado
            },
            emailRedirectTo: window.location.origin,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu e-mail para confirmar o cadastro.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Calendário do Zaqueu</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Seu calendário brasileiro completo 🇧🇷
          </p>
        </div>

        <Card className="shadow-xl border-2 border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Acesse seus eventos e compromissos'
                : 'Crie uma conta para salvar seus eventos'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                    <InputMask
                      mask="(99) 99999-9999"
                      value={phone}
                      onChange={(e: any) => setPhone(e.target.value)}
                      required={!isLogin}
                    >
                      {/* Remova o @ts-ignore e tente este formato mais simples se o outro falhar */}
  		      {(inputProps: any) => (
    			<Input
      			 {...inputProps}
      			 id="phone"
      			 type="text"
      			 placeholder="(88) 99999-9999"
                        />
                      )}
                    </InputMask>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full text-lg h-12" disabled={loading}>
                {loading ? (
                  'Aguarde...'
                ) : isLogin ? (
                  <span className="flex items-center gap-2"><LogIn className="w-5 h-5" /> Entrar</span>
                ) : (
                  <span className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Criar Conta</span>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;