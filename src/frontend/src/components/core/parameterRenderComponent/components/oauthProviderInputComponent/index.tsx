import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForwardedIconComponent from "@/components/common/genericIconComponent";
import LoadingTextComponent from "@/components/common/loadingTextComponent";
import type { BaseInputProps } from "@/components/core/parameterRenderComponent/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import {
  Popover,
  PopoverContentWithoutPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type IOAuthProviderRead,
  useGetOAuthProvidersQuery,
  useGetOAuthProviderTypesQuery,
} from "@/controllers/API/queries/oauth-providers";
import { cn } from "@/utils/utils";

type OAuthProviderInputComponentProps = BaseInputProps<string> & {
  providerFilter?: string[];
  placeholder?: string;
};

function getTokenStatusBadgeVariant(
  status: IOAuthProviderRead["token_status"],
): "successStatic" | "errorStatic" | "secondaryStatic" {
  if (status === "valid") return "successStatic";
  if (status === "expired") return "errorStatic";
  return "secondaryStatic";
}

function getTokenStatusLabel(
  status: IOAuthProviderRead["token_status"],
): string {
  switch (status) {
    case "valid":
      return "Valid";
    case "expired":
      return "Expired";
    case "not_connected":
      return "Not connected";
    default:
      return "Unknown";
  }
}

export default function OAuthProviderInputComponent({
  id,
  value,
  disabled,
  handleOnNewValue,
  providerFilter = [],
  placeholder = "Select OAuth Provider",
}: OAuthProviderInputComponentProps) {
  const navigate = useNavigate();
  const refButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const { data: providersData, isLoading: isLoadingProviders } =
    useGetOAuthProvidersQuery();
  const { data: providerTypes = [] } = useGetOAuthProviderTypesQuery();

  const providerIconBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const provider of providerTypes) {
      map.set(provider.id, provider.icon);
    }
    return map;
  }, [providerTypes]);

  const accounts = useMemo(() => {
    const allAccounts = providersData?.accounts ?? [];
    const activeAccounts = allAccounts.filter((account) => account.is_active);
    if (providerFilter.length === 0) {
      return activeAccounts;
    }
    return activeAccounts.filter((account) =>
      providerFilter.includes(account.provider),
    );
  }, [providerFilter, providersData?.accounts]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === value) ?? null,
    [accounts, value],
  );

  const handleSelect = (account: IOAuthProviderRead) => {
    handleOnNewValue({ value: account.id });
    setOpen(false);
  };

  const handleManageProviders = () => {
    setOpen(false);
    navigate("/settings/oauth-providers");
  };

  if (isLoadingProviders) {
    return (
      <Button
        className="dropdown-component-false-outline w-full justify-between py-2 font-normal"
        variant="primary"
        size="xs"
        disabled
      >
        <LoadingTextComponent text="Loading OAuth providers…" />
      </Button>
    );
  }

  if (accounts.length === 0) {
    return (
      <Button
        variant="outline"
        size="xs"
        className="dropdown-component-false-outline w-full justify-start gap-2 py-2 font-normal"
        onClick={handleManageProviders}
        disabled={disabled}
        data-testid={id}
      >
        <ForwardedIconComponent
          name="KeyRound"
          className="h-4 w-4 flex-shrink-0 text-muted-foreground"
        />
        <div className="text-[13px] text-muted-foreground">{placeholder}</div>
      </Button>
    );
  }

  const selectedIcon =
    providerIconBySlug.get(selectedAccount?.provider ?? "") ?? "KeyRound";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="primary"
          size="xs"
          role="combobox"
          ref={refButton}
          aria-expanded={open}
          data-testid={id}
          className={cn(
            "dropdown-component-false-outline py-2",
            "no-focus-visible w-full justify-between font-normal disabled:bg-muted disabled:text-muted-foreground",
          )}
        >
          <span
            className="flex w-full items-center gap-2 overflow-hidden"
            data-testid={`value-dropdown-${id}`}
          >
            <ForwardedIconComponent
              name={selectedIcon}
              className="h-4 w-4 flex-shrink-0"
            />
            <div className="truncate">
              <span className="truncate">
                {selectedAccount?.name ?? placeholder}
              </span>
            </div>
          </span>
          <ForwardedIconComponent
            name={disabled ? "Lock" : "ChevronsUpDown"}
            className={cn(
              "ml-2 h-4 w-4 shrink-0 text-foreground",
              disabled
                ? "text-placeholder-foreground hover:text-placeholder-foreground"
                : "hover:text-foreground",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContentWithoutPortal
        side="bottom"
        avoidCollisions={true}
        className="noflow nowheel nopan nodelete nodrag p-0"
        style={{ minWidth: refButton?.current?.clientWidth ?? "240px" }}
      >
        <Command className="flex flex-col">
          <CommandList className="max-h-[300px] overflow-y-auto">
            {accounts.map((account) => {
              const icon =
                providerIconBySlug.get(account.provider) ?? "KeyRound";
              const isSelected = account.id === value;
              return (
                <CommandItem
                  key={account.id}
                  value={account.id}
                  onSelect={() => handleSelect(account)}
                  className="cursor-pointer"
                  data-testid={`oauth-provider-option-${account.id}`}
                >
                  <div className="flex w-full items-center gap-2">
                    <ForwardedIconComponent
                      name={icon}
                      className="h-4 w-4 flex-shrink-0"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm">{account.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {account.provider}
                      </span>
                    </div>
                    <Badge
                      variant={getTokenStatusBadgeVariant(account.token_status)}
                      size="sq"
                      className="text-xs"
                    >
                      {getTokenStatusLabel(account.token_status)}
                    </Badge>
                    {isSelected && (
                      <ForwardedIconComponent
                        name="Check"
                        className="h-4 w-4 flex-shrink-0 text-primary"
                      />
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandList>
          <Button
            className="w-full flex cursor-pointer items-center justify-start gap-2 truncate py-2 text-xs text-muted-foreground px-3 hover:bg-accent group"
            unstyled
            data-testid="manage-oauth-providers"
            onClick={handleManageProviders}
          >
            <div className="flex items-center gap-2 pl-1 group-hover:text-primary">
              Manage OAuth Providers
              <ForwardedIconComponent
                name="Settings"
                className="w-4 h-4 text-muted-foreground group-hover:text-primary"
              />
            </div>
          </Button>
        </Command>
      </PopoverContentWithoutPortal>
    </Popover>
  );
}
