import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Calendar, Lock } from 'lucide-react';
import {
  clearRecoveryPending,
  hasRecoveryParamsFromLocation,
  hasValidRecoveryFlag,
  setRecoveryPending,
} from '@/lib/authRecovery';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hasRecoveryParams = hasRecoveryParamsFromLocation();

    if (hasRecoveryParams) {
      setRecoveryPending();
      setIsRecovery(true);
    }

    if (hasValidRecoveryFlag()) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryPending();
        setIsRecovery(true);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && (hasRecoveryParamsFromLocation() || hasValidRecoveryFlag())) {
        setIsRecovery(true);
      }
    });

    // Check if there's already an active session tied to recovery context
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && (hasRecoveryParams || hasValidRecoveryFlag())) {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: 'Sucesso!', description: 'Sua senha foi redefinida com sucesso.' });
      clearRecoveryPending();
      navigate('/');
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Este link de recuperação é inválido ou expirou.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              clearRecoveryPending();
              navigate('/auth');
            }} className="w-full">Voltar ao login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-4xl font-bold text-foreground">Nova Senha</h1>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" /> Redefinir Senha
            </CardTitle>
            <CardDescription>Digite sua nova senha abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? 'Salvando...' : 'Redefinir Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
