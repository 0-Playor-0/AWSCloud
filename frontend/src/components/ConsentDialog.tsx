import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { REPO_URL, t } from "@/lib/strings";

interface Props {
  open: boolean;
  onAgree: () => void;
  onCancel: () => void;
}

/** HANDOFF.md 4.7: shown before the first upload; consent lives in memory only. */
export function ConsentDialog({ open, onAgree, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogTitle>{t("consent.title")}</DialogTitle>
        <DialogDescription asChild>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>{t("consent.sent")}</li>
            <li>{t("consent.happens")}</li>
            <li>{t("consent.never")}</li>
            <li>
              {t("consent.repo")}{" "}
              <a className="underline" href={REPO_URL} target="_blank" rel="noreferrer">
                {t("consent.repoLink")}
              </a>
            </li>
          </ul>
        </DialogDescription>
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
