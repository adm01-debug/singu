import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Chrome } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { logger } from "@/lib/logger";
import { checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt, getRemainingAttempts, formatRetryTime } from '@/lib/rateLimiter';

// Validation schemas
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres');

type AuthMode = 'login' | 'signup';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (!user) return;
    const redirectTo = (location.state as { from?: string } | null)?.from || '/';
    navigate(redirectTo, { replace: true });
  }, [user, navigate, location.state]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (mode === 'signup') {
      try {
        nameSchema.parse(firstName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.firstName = e.errors[0].message;
        }
      }

      try {
        nameSchema.parse(lastName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.lastName = e.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Rate limiting check for login
    if (mode === 'login') {
      const { allowed, retryAfterSeconds } = checkRateLimit(email);
      if (!allowed && retryAfterSeconds) {
        toast.error(`Muitas tentativas. Tente novamente em ${formatRetryTime(retryAfterSeconds)}.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          const result = recordFailedAttempt(email);
          const remaining = getRemainingAttempts(email);

          if (result.lockedOut && result.retryAfterSeconds) {
            toast.error(`Conta temporariamente bloqueada. Tente novamente em ${formatRetryTime(result.retryAfterSeconds)}.`);
          } else if (remaining <= 2) {
            toast.error(`${error.message} (${remaining} tentativa${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`);
          } else {
            toast.error(error.message);
          }
        } else {
          recordSuccessfulAttempt(email);
          const redirectTo = (location.state as { from?: string } | null)?.from || '/onboarding';
          toast.success('Bem-vindo de volta!');
          navigate(redirectTo, { replace: true });
        }
      } else {
        const { error, needsEmailVerification } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName
        });
        if (error) {
          toast.error(error.message);
        } else if (needsEmailVerification) {
          toast.success('Conta criada! Verifique seu email para ativar o acesso.');
          setMode('login');
          setPassword('');
        } else {
          toast.success('Conta criada com sucesso! Vamos configurar sua conta!');
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (error) {
      logger.error('Auth submit error:', error);
      toast.error('Não foi possível concluir a autenticação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
        <div className="absolute inset-0 bg-black/5" />
        
        {/* Modern geometric decorative elements */}
        <div className="absolute top-16 left-16 w-72 h-72 bg-white/8 rounded-3xl blur-3xl rotate-12" />
        <div className="absolute bottom-16 right-16 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        {/* Animated network lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="networkGrid" width="64" height="64" patternUnits="userSpaceOnUse">
              <circle cx="32" cy="32" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#networkGrid)" />
          <line x1="10%" y1="20%" x2="40%" y2="45%" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <line x1="40%" y1="45%" x2="75%" y2="30%" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <line x1="75%" y1="30%" x2="60%" y2="70%" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <line x1="60%" y1="70%" x2="25%" y2="80%" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <line x1="25%" y1="80%" x2="10%" y2="20%" stroke="white" strokeWidth="0.5" opacity="0.2" />
          <circle cx="10%" cy="20%" r="4" fill="white" opacity="0.15" />
          <circle cx="40%" cy="45%" r="5" fill="white" opacity="0.2" />
          <circle cx="75%" cy="30%" r="3.5" fill="white" opacity="0.15" />
          <circle cx="60%" cy="70%" r="4.5" fill="white" opacity="0.18" />
          <circle cx="25%" cy="80%" r="3" fill="white" opacity="0.12" />
        </svg>
        
        <div className="relative z-10 flex flex-col justify-center items-start p-16 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-10"
          >
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center ring-1 ring-white/20"
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="w-7 h-7" aria-hidden="true" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SINGU</h1>
              <p className="text-primary-foreground/60 text-sm tracking-widest uppercase">Inteligência Relacional</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-5 max-w-lg"
          >
            <h2 className="text-5xl font-bold leading-[1.1] tracking-tight">
              Relacionamentos<br />
              <span className="text-primary-foreground/80">que convertem.</span>
            </h2>
            <p className="text-lg text-primary-foreground/65 leading-relaxed">
              CRM com análise comportamental profunda, insights automáticos e inteligência emocional para suas negociações.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid grid-cols-2 gap-3"
          >
            {[
              { icon: '🎯', text: 'Perfil DISC automático' },
              { icon: '🧠', text: 'Análise emocional' },
              { icon: '💡', text: 'Insights proativos' },
              { icon: '📊', text: 'Score de relacionamento' },
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-3 bg-white/12 backdrop-blur-sm rounded-xl px-4 py-3.5 ring-1 ring-white/15"
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.16)' }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-xl" role="img" aria-hidden="true">{feature.icon}</span>
                <span className="text-sm font-medium text-primary-foreground">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {['bg-primary', 'bg-accent', 'bg-success', 'bg-secondary'].map((bg, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${bg} ring-2 ring-white/20 flex items-center justify-center text-[10px] font-bold text-primary-foreground`}>
                  {['MS', 'JR', 'AL', 'PK'][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-primary-foreground/70">
              <span className="font-semibold text-primary-foreground/90">+500 profissionais</span> já usam o SINGU
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SINGU</h1>
              <p className="text-xs text-muted-foreground">Inteligência Relacional</p>
            </div>
          </div>

          <Card className="border-border/30 shadow-md shadow-primary/5 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
              </CardTitle>
              <CardDescription>
                {mode === 'login' 
                  ? 'Acesse sua conta para continuar' 
                  : 'Preencha os dados para começar'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            placeholder="João"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                            className={`pl-10 ${errors.firstName ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.firstName && (
                          <p className="text-xs text-destructive">{errors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input
                          id="lastName"
                          placeholder="Silva"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                          className={errors.lastName ? 'border-destructive' : ''}
                        />
                        {errors.lastName && (
                          <p className="text-xs text-destructive">{errors.lastName}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {mode === 'login' ? 'Entrar' : 'Criar conta'}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Google Login */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast.error('Erro ao entrar com Google. Tente novamente.');
                    logger.error('Google OAuth error:', error);
                  }
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Entrar com Google
              </Button>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="ml-1 text-primary hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Criar conta' : 'Entrar'}
                  </button>
                </p>
              </div>

              {mode === 'signup' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-xs text-center text-muted-foreground"
                >
                  Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
                </motion.p>
              )}
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Análise comportamental com IA integrada</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
