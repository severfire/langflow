import type { ColDef, ICellRendererParams } from "ag-grid-community";
import ForwardedIconComponent from "@/components/common/genericIconComponent";
import { Badge } from "@/components/ui/badge";
import type { IOAuthAccountRead } from "@/controllers/API/queries/oauth-accounts";

const TOKEN_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: string;
  }
> = {
  valid: { label: "Valid", variant: "default", icon: "CheckCircle" },
  expired: { label: "Expired", variant: "destructive", icon: "AlertCircle" },
  not_connected: {
    label: "Not connected",
    variant: "secondary",
    icon: "MinusCircle",
  },
  unknown: { label: "Unknown", variant: "outline", icon: "HelpCircle" },
};

const FLOW_TYPE_LABELS: Record<string, string> = {
  client_credentials: "Client Credentials",
  authorization_code: "Authorization Code",
  service_account: "Service Account",
  api_key: "API Key", // pragma: allowlist secret
};

function TokenStatusCell({ value }: { value: string }) {
  const cfg = TOKEN_STATUS_CONFIG[value] ?? TOKEN_STATUS_CONFIG.unknown;
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs">
      <ForwardedIconComponent name={cfg.icon} className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export function getColumnDefs(): ColDef<IOAuthAccountRead>[] {
  return [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      showDisabledCheckboxes: true,
      width: 48,
      maxWidth: 48,
      resizable: false,
    },
    {
      headerName: "Name",
      field: "name",
      flex: 2,
    },
    {
      headerName: "Provider",
      field: "provider",
      flex: 1,
    },
    {
      headerName: "Flow Type",
      field: "flow_type",
      flex: 1,
      cellRenderer: ({ value }: ICellRendererParams) =>
        FLOW_TYPE_LABELS[value] ?? value,
    },
    {
      headerName: "Scopes",
      field: "scopes",
      flex: 2,
      cellRenderer: ({ value }: ICellRendererParams) =>
        Array.isArray(value) ? value.join(", ") || "—" : "—",
    },
    {
      headerName: "Token Status",
      field: "token_status",
      width: 140,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <TokenStatusCell value={value} />
      ),
    },
    {
      headerName: "Last Validated",
      field: "last_validated_at",
      flex: 1,
      cellRenderer: ({ value }: ICellRendererParams) =>
        value ? new Date(value).toLocaleString() : "—",
    },
  ];
}
