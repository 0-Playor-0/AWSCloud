import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { REPO_URL, t } from "@/lib/strings";

interface Props {
  open: boolean;
  onAgree: () => void;
  onCancel: () => void;
}

/** HANDOFF.md 4.7: shown before the first text is sent; consent lives in memory only. */
export function ConsentDialog({ open, onAgree, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogTitle>{t("consent.title")}</DialogTitle>
        <DialogDescription>{t("consent.body")}</DialogDescription>
        <p className="mt-3 text-sm">
          {t("consent.repo")}{" "}
          <a className="underline" href={REPO_URL} target="_blank" rel="noreferrer">{t("consent.repoLink")}</a>
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onAgree}>{t("consent.agree")}</Button>
          <DialogClose asChild>
            <Button variant="outline">{t("consent.cancel")}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
