import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LuxButton } from '@/components/lux/LuxButton';
import type { Tables } from '@/integrations/supabase/types';

type Company = Tables<'companies'>;

interface EmpresaHeaderProps {
  company: Company;
  onAddContact: () => void;
  onEdit: () => void;
  onTriggerLux: () => void;
  luxTriggering: boolean;
  luxProcessing: boolean;
}

export const EmpresaHeader = ({
  company,
  onAddContact,
  onEdit,
  onTriggerLux,
  luxTriggering,
  luxProcessing,
}: EmpresaHeaderProps) => {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="px-4 md:px-6 pt-3 md:pt-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link to="/empresas" className="transition-colors hover:text-foreground">Empresas</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-foreground">{company.name}</li>
          </ol>
        </nav>
      </div>

      {/* Header with gradient background */}
      <div className="h-56 bg-gradient-primary relative z-0 overflow-hidden rounded-2xl mx-4 md:mx-6 mt-2">
        <div className="absolute top-4 left-4">
          <Link to="/empresas">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LuxButton
            onClick={onTriggerLux}
            loading={luxTriggering}
            processing={luxProcessing}
            variant="header"
          />
          <Button
            className="bg-white/10 backdrop-blur hover:bg-white/20 text-white border-0"
            onClick={onAddContact}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
          <Button
            className="bg-white/10 backdrop-blur hover:bg-white/20 text-white border-0"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>
    </>
  );
};
