import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Wifi, WifiOff, Plus, RefreshCw, Trash2, QrCode,
  Send, Phone, Video, Paperclip, Smile, Search, MoreVertical,
  Settings, Users, Tag, BarChart3, ArrowLeft, Check, CheckCheck,
  Clock, AlertCircle, Smartphone, Globe, Shield, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Sidebar } from '@/components/layout/Sidebar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Status icon helper
function MessageStatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case 'sent': return <Check className="w-3 h-3 text-muted-foreground" />;
    case 'delivered': return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
    case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
    case 'played': return <CheckCheck className="w-3 h-3 text-blue-500" />;
    case 'error': return <AlertCircle className="w-3 h-3 text-destructive" />;
    case 'pending': return <Clock className="w-3 h-3 text-muted-foreground" />;
    default: return null;
  }
}

// ========================
// INSTANCES PANEL
// ========================
function InstancesPanel() {
  const { instances, instancesLoading, createInstance, connectInstance, restartInstance, logoutInstance, deleteInstance, getInstanceInfo, configureWebhook } = useWhatsApp();
  const [newInstanceName, setNewInstanceName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [instanceStates, setInstanceStates] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    if (!newInstanceName.trim()) return;
    try {
      const result = await createInstance.mutateAsync({
        instanceName: newInstanceName.trim(),
      });
      if (result?.qrcode?.base64) {
        setQrCode(result.qrcode.base64);
        setSelectedInstance(newInstanceName.trim());
      }
      setNewInstanceName('');
      setShowCreate(false);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleConnect = async (name: string) => {
    try {
      const result = await connectInstance.mutateAsync(name);
      if (result?.base64) {
        setQrCode(result.base64);
        setSelectedInstance(name);
      }
    } catch (err) {
      toast.error('Erro ao conectar instância');
    }
  };

  const loadInstanceStates = async () => {
    if (!instances || !Array.isArray(instances)) return;
    const states: Record<string, string> = {};
    for (const inst of instances) {
      const name = inst.instance?.instanceName || inst.instanceName;
      if (!name) continue;
      try {
        const info = await getInstanceInfo(name);
        states[name] = info?.state || 'unknown';
      } catch {
        states[name] = 'error';
      }
    }
    setInstanceStates(states);
  };

  useEffect(() => {
    if (instances && Array.isArray(instances)) {
      loadInstanceStates();
    }
  }, [instances]);

  const instanceList = Array.isArray(instances) ? instances : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          Instâncias WhatsApp
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadInstanceStates} disabled={instancesLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${instancesLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Nova Instância
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Instância</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nome da Instância</Label>
                  <Input
                    placeholder="ex: vendas-principal"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use apenas letras, números e hífens
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={createInstance.isPending}>
                  {createInstance.isPending ? 'Criando...' : 'Criar Instância'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrCode} onOpenChange={() => setQrCode(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Escaneie o QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCode && (
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64 rounded-lg border"
              />
            )}
            <p className="text-sm text-muted-foreground text-center">
              Abra o WhatsApp no celular → Dispositivos Vinculados → Vincular Dispositivo
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instanceList.map((inst: any) => {
          const name = inst.instance?.instanceName || inst.instanceName || 'Sem nome';
          const state = instanceStates[name] || 'checking...';
          const isConnected = state === 'open';

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border-l-4 ${isConnected ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="font-medium text-sm">{name}</span>
                    </div>
                    <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
                      {state}
                    </Badge>
                  </div>

                  {inst.instance?.owner && (
                    <p className="text-xs text-muted-foreground mb-3">
                      📱 {inst.instance.owner.replace('@s.whatsapp.net', '')}
                    </p>
                  )}

                  <div className="flex gap-1 flex-wrap">
                    {!isConnected && (
                      <Button size="sm" variant="outline" onClick={() => handleConnect(name)} className="text-xs h-7">
                        <QrCode className="w-3 h-3 mr-1" />
                        Conectar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => restartInstance.mutate(name)} className="text-xs h-7">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reiniciar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => logoutInstance.mutate(name)}>
                          <WifiOff className="w-4 h-4 mr-2" /> Desconectar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteInstance.mutate(name)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {instanceList.length === 0 && !instancesLoading && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Nenhuma instância encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie uma instância para conectar seu WhatsApp ao CRM
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Criar Primeira Instância
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ========================
// CHAT PANEL
// ========================
function ChatPanel() {
  const { instances, fetchChats, fetchMessages, sendMessage } = useWhatsApp();
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const instanceList = Array.isArray(instances) ? instances : [];

  const loadChats = async (instName: string) => {
    setLoadingChats(true);
    try {
      const result = await fetchChats(instName);
      setChats(Array.isArray(result) ? result : []);
    } catch (err) {
      toast.error('Erro ao carregar chats');
    }
    setLoadingChats(false);
  };

  const loadMessages = async (remoteJid: string) => {
    if (!selectedInstance) return;
    setLoadingMessages(true);
    try {
      const result = await fetchMessages(selectedInstance, remoteJid, 50);
      const msgs = Array.isArray(result) ? result : result?.messages || [];
      setMessages(msgs);
    } catch (err) {
      toast.error('Erro ao carregar mensagens');
    }
    setLoadingMessages(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || !selectedInstance) return;
    try {
      await sendMessage.mutateAsync({
        instanceName: selectedInstance,
        remoteJid: selectedChat,
        message: newMessage,
      });
      setNewMessage('');
      // Reload messages
      loadMessages(selectedChat);
    } catch (err) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  useEffect(() => {
    if (selectedInstance) {
      loadChats(selectedInstance);
    }
  }, [selectedInstance]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  const filteredChats = chats.filter(c => {
    const name = c.name || c.id || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-220px)] border rounded-lg overflow-hidden bg-background">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Instance Selector */}
        <div className="p-3 border-b">
          <select
            className="w-full text-sm border rounded-md px-3 py-2 bg-background"
            value={selectedInstance}
            onChange={(e) => {
              setSelectedInstance(e.target.value);
              setSelectedChat(null);
            }}
          >
            <option value="">Selecione a instância</option>
            {instanceList.map((inst: any) => (
              <option key={inst.instance?.instanceName || inst.instanceName} value={inst.instance?.instanceName || inst.instanceName}>
                {inst.instance?.instanceName || inst.instanceName}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              className="pl-9 h-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {loadingChats ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Carregando chats...</div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {selectedInstance ? 'Nenhum chat encontrado' : 'Selecione uma instância'}
            </div>
          ) : (
            filteredChats.map((chat: any) => {
              const chatId = chat.id || chat.remoteJid;
              const isGroup = chatId?.includes('@g.us');
              const name = chat.name || chat.pushName || chatId?.replace('@s.whatsapp.net', '').replace('@g.us', '') || 'Desconhecido';

              return (
                <button
                  key={chatId}
                  onClick={() => setSelectedChat(chatId)}
                  className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${selectedChat === chatId ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {isGroup ? (
                        <Users className="w-5 h-5 text-primary" />
                      ) : (
                        <span className="text-sm font-semibold text-primary">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">{
                          typeof chat.lastMessage === 'string' ? chat.lastMessage : chat.lastMessage?.conversation || ''
                        }</p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <Badge variant="default" className="text-xs h-5 min-w-[20px] justify-center">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedChat(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm">
                  {selectedChat.replace('@s.whatsapp.net', '').replace('@g.us', '')}
                </span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => loadMessages(selectedChat)}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="text-center text-sm text-muted-foreground">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">Nenhuma mensagem encontrada</div>
              ) : (
                <div className="space-y-2">
                  {[...messages].reverse().map((msg: any, idx: number) => {
                    const isMe = msg.key?.fromMe;
                    const content = msg.message?.conversation ||
                      msg.message?.extendedTextMessage?.text ||
                      msg.message?.imageMessage?.caption ||
                      (msg.message?.audioMessage ? '[Áudio]' : '') ||
                      (msg.message?.documentMessage ? `[${msg.message.documentMessage.fileName || 'Documento'}]` : '') ||
                      (msg.message?.stickerMessage ? '[Figurinha]' : '') ||
                      (msg.message?.locationMessage ? '[Localização]' : '') ||
                      '[Mensagem]';

                    const timestamp = msg.messageTimestamp
                      ? new Date(msg.messageTimestamp * 1000)
                      : new Date();

                    return (
                      <div key={msg.key?.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                          isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          {!isMe && msg.pushName && (
                            <p className="text-xs font-semibold mb-1 opacity-80">{msg.pushName}</p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] opacity-70">
                              {format(timestamp, 'HH:mm', { locale: ptBR })}
                            </span>
                            {isMe && <MessageStatusIcon status={msg.status?.toLowerCase() || 'sent'} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t flex gap-2">
              <Input
                placeholder="Digite uma mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={sendMessage.isPending || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Selecione uma conversa</p>
              <p className="text-sm">Escolha um chat para visualizar as mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// KPI PANEL
// ========================
function KpiPanel() {
  const { instances } = useWhatsApp();
  const { user } = useAuth();

  const kpis = [
    { label: 'Mensagens Enviadas', value: '—', icon: Send, color: 'text-blue-500' },
    { label: 'Mensagens Recebidas', value: '—', icon: MessageSquare, color: 'text-green-500' },
    { label: 'Taxa de Entrega', value: '—', icon: CheckCheck, color: 'text-emerald-500' },
    { label: 'Taxa de Leitura', value: '—', icon: Check, color: 'text-cyan-500' },
    { label: 'Tempo Médio Resposta', value: '—', icon: Clock, color: 'text-amber-500' },
    { label: 'Contatos Únicos', value: '—', icon: Users, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        KPIs WhatsApp
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 text-center">
              <kpi.icon className={`w-6 h-6 mx-auto mb-2 ${kpi.color}`} />
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            Os KPIs serão calculados automaticamente conforme as mensagens são processadas pelo webhook.
            Configure o webhook na aba de Instâncias para começar a monitorar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ========================
// MAIN PAGE
// ========================
export default function WhatsApp() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                </div>
                WhatsApp
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gerencie instâncias, conversas e monitoramento via Evolution API
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: Smartphone, title: 'Multi-Instância', desc: 'Múltiplos números conectados', color: 'text-blue-500' },
              { icon: Zap, title: 'Mensagens Ricas', desc: 'Texto, mídia, botões, listas', color: 'text-amber-500' },
              { icon: Globe, title: 'Webhook em Tempo Real', desc: '25+ eventos monitorados', color: 'text-green-500' },
              { icon: Shield, title: 'Análise Automática', desc: 'DISC, NLP e sentimentos', color: 'text-purple-500' },
            ].map((feat) => (
              <Card key={feat.title} className="border-none bg-muted/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <feat.icon className={`w-8 h-8 ${feat.color}`} />
                  <div>
                    <p className="font-medium text-sm">{feat.title}</p>
                    <p className="text-xs text-muted-foreground">{feat.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="instances" className="space-y-4">
            <TabsList>
              <TabsTrigger value="instances" className="flex items-center gap-1">
                <Smartphone className="w-4 h-4" />
                Instâncias
              </TabsTrigger>
              <TabsTrigger value="chats" className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                Conversas
              </TabsTrigger>
              <TabsTrigger value="kpis" className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                KPIs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="instances">
              <InstancesPanel />
            </TabsContent>

            <TabsContent value="chats">
              <ChatPanel />
            </TabsContent>

            <TabsContent value="kpis">
              <KpiPanel />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
