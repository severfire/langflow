import ForwardedIconComponent from "@/components/common/genericIconComponent";
import { Button } from "@/components/ui/button";

type OAuthProviderHeaderProps = {
  selectedRows: string[];
  onAdd: () => void;
  onDelete: () => void;
};

export default function OAuthProviderHeader({
  selectedRows,
  onAdd,
  onDelete,
}: OAuthProviderHeaderProps) {
  return (
    <div className="flex w-full items-start justify-between gap-6">
      <div className="flex w-full flex-col">
        <h2
          className="flex items-center text-lg font-semibold tracking-tight"
          data-testid="settings_menu_header"
        >
          OAuth Providers
          <ForwardedIconComponent
            name="KeyRound"
            className="ml-2 h-5 w-5 text-primary"
          />
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage OAuth2 credentials for external services. Tokens are stored
          encrypted and can be validated or rotated at any time.
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {selectedRows.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            data-testid="oauth-delete-button"
          >
            <ForwardedIconComponent name="Trash2" className="mr-1 w-4" />
            Delete ({selectedRows.length})
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onAdd}
          data-testid="oauth-add-button"
        >
          <ForwardedIconComponent name="Plus" className="w-4" />
          Add Account
        </Button>
      </div>
    </div>
  );
}
