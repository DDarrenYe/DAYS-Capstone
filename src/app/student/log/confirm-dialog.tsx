import { Notice } from "@/app/student/log/part";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirm,
  pendingLabel,
  pending = false,
  error,
  variant = "destructive",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirm: string;
  pendingLabel: string;
  pending?: boolean;
  error?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}) => (
  <AlertDialog onOpenChange={onOpenChange} open={open}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {error ? <Notice>{error}</Notice> : null}
      <AlertDialogFooter>
        <AlertDialogClose render={<Button variant="outline" />}>
          Cancel
        </AlertDialogClose>
        <Button disabled={pending} onClick={onConfirm} variant={variant}>
          {pending ? pendingLabel : confirm}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
