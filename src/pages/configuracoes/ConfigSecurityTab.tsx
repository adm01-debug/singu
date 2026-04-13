import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ConfigSecurityTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Segurança
          </CardTitle>
          <CardDescription>Gerencie suas configurações de segurança</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Alterar Senha</p>
                  <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
                </div>
                <Button variant="outline" size="sm">Alterar</Button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Sessões Ativas</p>
                  <p className="text-sm text-muted-foreground">Gerencie os dispositivos conectados</p>
                </div>
                <Button variant="outline" size="sm">Ver Sessões</Button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-destructive">Excluir Conta</p>
                  <p className="text-sm text-muted-foreground">Esta ação é irreversível</p>
                </div>
                <Button variant="destructive" size="sm">Excluir</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
