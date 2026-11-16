import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ShownError } from "@/lib/errors";
import { t } from "@/lib/strings";

interface Props {
  error: ShownError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorAlert({ error, onRetry, onDismiss }: Props) {
  return (
    <Alert variant="destructive" role="alert" data-error-code={error.code}>
      <AlertTitle>{error.message}</AlertTitle>
      <AlertDescription>{error.hint}</AlertDescription>
      {(onRetry || onDismiss) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {onRetry && <Button size="sm" onClick={onRetry}>{t("error.retry")}</Button>}
          {onDismiss && <Button size="sm" variant="outline" onClick={onDismiss}>{t("error.dismiss")}</Button>}
        </div>
      )}
    </Alert>
  );
}
