import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Radar } from "lucide-react";
import { PixelSetupCard } from "@/components/intent/PixelSetupCard";

export default function IntentSetupPage() {
  return (
    <AppLayout>
      <Helmet>
        <title>Configurar pixel · Intent Data — SINGU</title>
        <meta name="description" content="Gere e gerencie pixels de rastreamento first-party de intenção." />
      </Helmet>

      <div className="container py-6 space-y-6 max-w-3xl">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/intent"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
        </Button>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Radar className="h-6 w-6 text-primary" /> Configurar pixel de Intent
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cole o snippet no &lt;head&gt; do seu site. O pixel já captura page_view, form_submit e pricing_view automaticamente.
            Use <code className="text-xs bg-muted px-1 py-0.5 rounded">SinguIntent.identify(email, externalCompanyId)</code> para vincular sinais a contatos.
          </p>
        </header>

        <PixelSetupCard />
      </div>
    </AppLayout>
  );
}
