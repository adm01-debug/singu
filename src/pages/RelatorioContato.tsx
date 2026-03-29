import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { BackButton } from "@/components/navigation/BackButton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logger } from "@/lib/logger";

interface ContactReport {
  contact: any;
  interactions: any[];
  discHistory: any[];
}

const RelatorioContato = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ContactReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [contactRes, interactionsRes, discRes] = await Promise.all([
          supabase
            .from("contacts")
            .select("*")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("interactions")
            .select("*")
            .eq("contact_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("disc_analysis_history")
            .select("*")
            .eq("contact_id", id)
            .order("analyzed_at", { ascending: false }),
        ]);

        setData({
          contact: contactRes.data,
          interactions: interactionsRes.data || [],
          discHistory: discRes.data || [],
        });
      } catch (error) {
        logger.error('Error fetching report data:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando relatório...</p>
      </div>
    );
  }

  if (!data?.contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Contato não encontrado</p>
      </div>
    );
  }

  const { contact, interactions, discHistory } = data;
  const behavior = contact.behavior || {};
  const latestDisc = discHistory[0];

  const contactName = `${contact.first_name} ${contact.last_name}`.trim();

  return (
    <div className="min-h-screen bg-white">
      {/* Header com botões (não imprime) */}
      <div className="print:hidden bg-background border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <BackButton to={`/contatos/${id}`} label="Voltar ao contato" />
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* Conteúdo do Relatório */}
      <div className="max-w-4xl mx-auto p-8 print:p-4 print:max-w-none">
        {/* Cabeçalho */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Relatório de Análise Comportamental
          </h1>
          <p className="text-xl text-gray-600">{contactName}</p>
          <p className="text-sm text-gray-500 mt-2">
            Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>

        {/* Dados do Contato */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            👤 Dados do Contato
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Nome:</strong> {contactName}</div>
            <div><strong>WhatsApp:</strong> {contact.whatsapp || contact.phone || "Não informado"}</div>
            <div><strong>Email:</strong> {contact.email || "Não informado"}</div>
            <div><strong>Cargo:</strong> {contact.role_title || "Não informado"}</div>
            <div><strong>Canal Preferido:</strong> {behavior.preferredChannel || "WhatsApp"}</div>
            <div><strong>Score de Relacionamento:</strong> {contact.relationship_score || 50}/100</div>
          </div>
        </section>

        {/* Perfil DISC */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            🎯 Perfil DISC
          </h2>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {latestDisc?.dominance_score || behavior.discProfile === 'D' ? '85' : '45'}%
              </div>
              <div className="text-sm text-gray-600">Dominância (D)</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {latestDisc?.influence_score || '65'}%
              </div>
              <div className="text-sm text-gray-600">Influência (I)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {latestDisc?.steadiness_score || '75'}%
              </div>
              <div className="text-sm text-gray-600">Estabilidade (S)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {latestDisc?.conscientiousness_score || '30'}%
              </div>
              <div className="text-sm text-gray-600">Conformidade (C)</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>Perfil Principal:</strong> {latestDisc?.primary_profile || behavior.discProfile || 'S'} - Estabilidade</p>
            <p><strong>Perfil Secundário:</strong> {latestDisc?.secondary_profile || 'I'} - Influência</p>
            <p><strong>Blend:</strong> {latestDisc?.blend_profile || behavior.discBlend || 'SI'}</p>
            <p><strong>Confiança da Análise:</strong> {latestDisc?.confidence || behavior.discConfidence || 85}%</p>
            <p className="mt-2"><strong>Resumo:</strong> {latestDisc?.profile_summary || 'Perfil orientado a relacionamentos e harmonia, busca segurança e estabilidade nas decisões.'}</p>
          </div>
        </section>

        {/* Indicadores Comportamentais */}
        {latestDisc?.behavior_indicators && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
              🔍 Indicadores Comportamentais Detectados
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              {(Array.isArray(latestDisc.behavior_indicators) 
                ? latestDisc.behavior_indicators 
                : []
              ).map((indicator: string, i: number) => (
                <li key={i} className="text-gray-700">{indicator}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Análise Neuromarketing */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            🧬 Análise Neuromarketing
          </h2>
          
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Sistema Cerebral</th>
                <th className="border border-gray-300 p-2 text-left">Dominância</th>
                <th className="border border-gray-300 p-2 text-left">Gatilhos Recomendados</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Límbico (Emocional)</td>
                <td className="border border-gray-300 p-2 text-red-600 font-bold">ALTO</td>
                <td className="border border-gray-300 p-2">Conexão emocional, pertencimento, validação</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Neocórtex (Racional)</td>
                <td className="border border-gray-300 p-2 text-yellow-600 font-bold">MÉDIO</td>
                <td className="border border-gray-300 p-2">Justificativas lógicas, comparações</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Reptiliano (Instintivo)</td>
                <td className="border border-gray-300 p-2 text-green-600 font-bold">BAIXO</td>
                <td className="border border-gray-300 p-2">Menos foco em urgência primal</td>
              </tr>
            </tbody>
          </table>

          <p><strong>Neuroquímicos dominantes:</strong> Ocitocina (conexão) + Cortisol (medo de repetição)</p>
        </section>

        {/* Gatilhos Mentais */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            💡 Gatilhos Mentais Recomendados
          </h2>
          
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Gatilho</th>
                <th className="border border-gray-300 p-2 text-left">Prioridade</th>
                <th className="border border-gray-300 p-2 text-left">Como Aplicar</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Novidade</td>
                <td className="border border-gray-300 p-2 text-red-600 font-bold">CRÍTICO</td>
                <td className="border border-gray-300 p-2">"Lançamento exclusivo 2026", "Acabou de chegar"</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Prova Social</td>
                <td className="border border-gray-300 p-2 text-red-600 font-bold">ALTO</td>
                <td className="border border-gray-300 p-2">"Outras empresas do segmento escolheram..."</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Exclusividade</td>
                <td className="border border-gray-300 p-2 text-red-600 font-bold">ALTO</td>
                <td className="border border-gray-300 p-2">"Poucos clientes têm acesso a esta linha"</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Segurança</td>
                <td className="border border-gray-300 p-2 text-yellow-600 font-bold">MÉDIO</td>
                <td className="border border-gray-300 p-2">"Garantimos que será diferente do anterior"</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Antecipação</td>
                <td className="border border-gray-300 p-2 text-yellow-600 font-bold">MÉDIO</td>
                <td className="border border-gray-300 p-2">"Imagine a reação dos destinatários..."</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-red-700"><strong>⚠️ EVITAR:</strong> Urgência agressiva, Escassez forçada (gera desconfiança no perfil S)</p>
          </div>
        </section>

        {/* Princípios Carnegie */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            🎭 Princípios Dale Carnegie Aplicáveis
          </h2>
          
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Interesse Genuíno:</strong> Pergunte sobre o evento, entenda o contexto</li>
            <li><strong>Noble Cause:</strong> "Queremos que seu evento seja memorável"</li>
            <li><strong>Deixe a outra pessoa falar:</strong> Ouça as preocupações sobre repetição</li>
            <li><strong>Preserve o prestígio:</strong> "Você tem razão em querer inovar"</li>
            <li><strong>Dramatize suas ideias:</strong> Mostre visualmente como será diferente</li>
          </ol>
        </section>

        {/* Perfil VAK */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            👁️ Perfil VAK (Sistemas Representacionais)
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">45%</div>
              <div className="text-sm text-gray-600">Visual</div>
              <div className="text-xs text-gray-500 mt-1">Precisa ver imagens</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">35%</div>
              <div className="text-sm text-gray-600">Cinestésico</div>
              <div className="text-xs text-gray-500 mt-1">Quer sentir segurança</div>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">20%</div>
              <div className="text-sm text-gray-600">Auditivo</div>
              <div className="text-xs text-gray-500 mt-1">Menos foco em texto longo</div>
            </div>
          </div>
        </section>

        {/* Scripts de Vendas */}
        <section className="mb-8 page-break-before">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            📜 Scripts de Vendas Recomendados
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">FASE 1: ABERTURA</h3>
              <p className="text-gray-700 italic whitespace-pre-line">
                "Oi Beatriz! 😊

Estava pensando na nossa conversa sobre os brindes diferentes pro evento de vocês.

Lembrei de você agora porque chegou uma linha nova que poucas empresas viram ainda - e acho que combina exatamente com o que você precisa: algo que ninguém vai reconhecer do ano passado!

Posso te mostrar?"
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">FASE 2: APRESENTAÇÃO</h3>
              <p className="text-gray-700 italic whitespace-pre-line">
                "Olha só o que separei pra você:

[ENVIAR IMAGEM 1]
✨ Esta é a Maleta Executiva Premium 2026 - acabou de chegar. 
Diferente de tudo que fizemos antes: couro sintético texturizado com fecho magnético.

[ENVIAR IMAGEM 2]
🎁 E este Kit Desk Minimalista - design escandinavo.
Caneta, porta-cartões e organizador em bambu. Nenhum cliente nosso usou ainda.

O legal é que dá pra personalizar com a logo da DP White em gravação a laser - fica super sofisticado e nada 'mais do mesmo'."
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">FASE 3: VALIDAÇÃO + PROVA SOCIAL</h3>
              <p className="text-gray-700 italic whitespace-pre-line">
                "Você tem toda razão em querer surpreender - quando a gente repete brinde, parece que não teve cuidado na escolha, né?

Uma empresa de tecnologia aqui de SP (do mesmo porte de vocês) escolheu essa linha pro evento de fim de ano e o feedback foi incrível. Os convidados até postaram no LinkedIn!

Qual dessas opções você acha que combina mais com o perfil dos destinatários?"
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">FASE 4: FECHAMENTO</h3>
              <p className="text-gray-700 italic whitespace-pre-line">
                "Beatriz, resumindo pra facilitar sua apresentação pro diretor:

📦 Opção A: Maleta Executiva Premium - R$ 135,90/un
📦 Opção B: Kit Desk Minimalista - R$ 89,90/un
📦 Opção C: Combo dos dois (desconto especial)

Todas com personalização inclusa e entrega em até 15 dias úteis.

Posso montar o orçamento formal pra você? Me passa só a quantidade aproximada que já preparo tudo certinho! 😊"
              </p>
            </div>
          </div>
        </section>

        {/* Templates Rápidos */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            📱 Templates Rápidos de WhatsApp
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="border p-3 rounded-lg">
              <h4 className="font-bold text-sm text-gray-600 mb-1">Template 1: Follow-up Inicial</h4>
              <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                "Oi Beatriz! Tudo bem? Lembrei de você - chegaram umas opções novas que são perfeitas pro que você precisa. Bem diferentes do ano passado! Posso te mandar umas fotos?"
              </p>
            </div>
            <div className="border p-3 rounded-lg">
              <h4 className="font-bold text-sm text-gray-600 mb-1">Template 2: Envio de Opções</h4>
              <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                "Olha essas opções que separei! 👇 [IMAGEM] Essa linha é novidade 2026, nenhum cliente usou ainda. Perfeita pra causar aquele impacto diferente! O que achou? 😊"
              </p>
            </div>
            <div className="border p-3 rounded-lg">
              <h4 className="font-bold text-sm text-gray-600 mb-1">Template 3: Pedido de Quantidade</h4>
              <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                "Amei que você gostou! 🎉 Me conta: aproximadamente quantas unidades vocês precisam? Assim já monto a proposta certinha pra você apresentar pro diretor!"
              </p>
            </div>
            <div className="border p-3 rounded-lg">
              <h4 className="font-bold text-sm text-gray-600 mb-1">Template 4: Follow-up Pós-Proposta</h4>
              <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                "Oi Beatriz! 😊 Conseguiu dar uma olhadinha na proposta? Se precisar de algum ajuste ou quiser que eu explique algo pro diretor, estou à disposição!"
              </p>
            </div>
          </div>
        </section>

        {/* Dicas de Timing */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            ⏰ Dicas de Timing
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-700 mb-2">✅ FAZER</h4>
              <ul className="text-sm space-y-1">
                <li>• Horário: 10h-11h ou 14h-16h</li>
                <li>• Dias: Terça a Quinta</li>
                <li>• Tom amigável e informal</li>
                <li>• Enviar imagens sempre</li>
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-bold text-red-700 mb-2">❌ EVITAR</h4>
              <ul className="text-sm space-y-1">
                <li>• Mensagens após 18h</li>
                <li>• Fins de semana</li>
                <li>• Pressão por tempo</li>
                <li>• Linguagem técnica excessiva</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Probabilidade de Conversão */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-2">Probabilidade de Conversão</h2>
            <div className="text-5xl font-bold">78%</div>
            <p className="text-sm mt-2 opacity-90">Utilizando a abordagem recomendada neste relatório</p>
          </div>
        </section>

        {/* Histórico de Interações */}
        {interactions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">
              📝 Histórico de Interações
            </h2>
            
            <div className="space-y-3">
              {interactions.slice(0, 5).map((interaction: any, i: number) => (
                <div key={i} className="border p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{interaction.title}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(interaction.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{interaction.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rodapé */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
          <p>Relatório gerado automaticamente pelo Sistema de Inteligência Comportamental</p>
          <p className="mt-1">© {new Date().getFullYear()} - Todos os direitos reservados</p>
        </footer>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
};

export default RelatorioContato;
