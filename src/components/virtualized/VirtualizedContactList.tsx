import { memo, useCallback } from 'react';
import { List, RowComponentProps } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { Building2, Mail, Phone } from 'lucide-react';
import { CSSProperties } from 'react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role_title?: string | null;
  company_id?: string | null;
  relationship_score?: number | null;
  tags?: string[] | null;
}

interface VirtualizedContactListProps {
  contacts: Contact[];
  height: number;
  onContactClick?: (contactId: string) => void;
  className?: string;
}

interface RowProps {
  contacts: Contact[];
  onContactClick: (contactId: string) => void;
}

const ContactRow = memo(({ 
  index, 
  style, 
  contacts, 
  onContactClick 
}: { 
  index: number; 
  style: CSSProperties; 
  contacts: Contact[]; 
  onContactClick: (contactId: string) => void;
}) => {
  const contact = contacts[index];

  if (!contact) return null;

  const initials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div style={style} className="px-2 py-1">
      <Card
        className="h-full cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
        onClick={() => onContactClick(contact.id)}
      >
        <div className="flex items-center gap-4 p-4 h-full">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            <AvatarImage src={contact.avatar_url || undefined} alt={`${contact.first_name} ${contact.last_name}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {contact.first_name} {contact.last_name}
            </h3>
            {contact.role_title && (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {contact.role_title}
              </p>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1 text-sm text-muted-foreground">
            {contact.email && (
              <span className="flex items-center gap-1 truncate max-w-32">
                <Mail className="h-3 w-3" />
                <span className="truncate">{contact.email}</span>
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contact.phone}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {contact.relationship_score !== null && contact.relationship_score !== undefined && (
              <RelationshipScore score={contact.relationship_score} size="sm" />
            )}
            {contact.tags && contact.tags.length > 0 && (
              <div className="flex gap-1">
                {contact.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {contact.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{contact.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

ContactRow.displayName = 'ContactRow';

// Row component wrapper for react-window
function RowComponent(props: RowComponentProps<RowProps>) {
  const { index, style, contacts, onContactClick } = props;
  return (
    <ContactRow 
      index={index} 
      style={style} 
      contacts={contacts} 
      onContactClick={onContactClick} 
    />
  );
}

export function VirtualizedContactList({
  contacts,
  height,
  onContactClick,
  className,
}: VirtualizedContactListProps) {
  const navigate = useNavigate();

  const handleContactClick = useCallback((contactId: string) => {
    if (onContactClick) {
      onContactClick(contactId);
    } else {
      navigate(`/contatos/${contactId}`);
    }
  }, [navigate, onContactClick]);

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Nenhum contato encontrado
      </div>
    );
  }

  return (
    <List<RowProps>
      className={className}
      style={{ height, width: '100%' }}
      rowCount={contacts.length}
      rowHeight={88}
      rowComponent={RowComponent}
      rowProps={{
        contacts,
        onContactClick: handleContactClick,
      }}
      overscanCount={5}
    />
  );
}

export default VirtualizedContactList;
