import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ContactForm } from '@/components/forms/ContactForm';
import { KeyboardShortcutsCheatsheet } from '@/components/keyboard/KeyboardShortcutsCheatsheet';
import type { Contact } from '@/hooks/useContacts';

interface Company {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ContatosDialogsProps {
  isFormOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
  editingContact: Contact | null;
  onEditingContactChange: (contact: Contact | null) => void;
  deletingContact: Contact | null;
  onDeletingContactChange: (contact: Contact | null) => void;
  companies: Company[];
  isSubmitting: boolean;
  onCreateSubmit: (data: Record<string, unknown>, event?: React.MouseEvent) => void;
  onEditSubmit: (data: Record<string, unknown>, event?: React.MouseEvent) => void;
  onDeleteConfirm: () => void;
  showShortcuts: boolean;
  onShowShortcutsChange: (open: boolean) => void;
}

export const ContatosDialogs = ({
  isFormOpen,
  onFormOpenChange,
  editingContact,
  onEditingContactChange,
  deletingContact,
  onDeletingContactChange,
  companies,
  isSubmitting,
  onCreateSubmit,
  onEditSubmit,
  onDeleteConfirm,
  showShortcuts,
  onShowShortcutsChange,
}: ContatosDialogsProps) => {
  return (
    <>
      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={onFormOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ContactForm
            companies={companies}
            onSubmit={onCreateSubmit}
            onCancel={() => onFormOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && onEditingContactChange(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ContactForm
            contact={editingContact}
            companies={companies}
            onSubmit={onEditSubmit}
            onCancel={() => onEditingContactChange(null)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && onDeletingContactChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingContact?.first_name} {deletingContact?.last_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsCheatsheet
        open={showShortcuts}
        onOpenChange={onShowShortcutsChange}
      />
    </>
  );
};
