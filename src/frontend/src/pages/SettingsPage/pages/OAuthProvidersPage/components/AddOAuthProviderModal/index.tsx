import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForwardedIconComponent from "@/components/common/genericIconComponent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type IOAuthProvider,
  type IOAuthProviderRead,
  type IOAuthProviderUpdate,
  type IRotateTokensResponse,
  type IValidateConnectionResponse,
  useAuthorizeOAuthProvider,
  useGetOAuthProvidersQuery,
  useGetOAuthProviderTypesQuery,
  usePatchOAuthProvider,
  usePostOAuthProvider,
  useRotateOAuthProvider,
  useValidateOAuthProvider,
} from "@/controllers/API/queries/oauth-providers";
import { BASE_URL_API, PROXY_TARGET } from "@/customization/config-constants";
import useAlertStore from "@/stores/alertStore";
import { cn } from "@/utils/utils";

type ApiError = { response?: { data?: { detail?: string } }; message?: string };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Single source of truth for which providers are exposed in the UI.
 * To add a new provider: append its id here — the API already returns
 * the full provider definition (icon, endpoints, flows, etc.).
 */
const SUPPORTED_PROVIDER_IDS = ["google", "github", "custom"] as const;
type SupportedProviderId = (typeof SUPPORTED_PROVIDER_IDS)[number];

/** Human-readable labels used as fallbacks when the API display_name is absent. */
const PROVIDER_LABELS: Record<SupportedProviderId, string> = {
  google: "Google Cloud",
  github: "GitHub",
  custom: "Custom Provider",
};

const FLOW_TYPE_OPTIONS = [
  { value: "client_credentials", label: "Client Credentials" },
  { value: "authorization_code", label: "Authorization Code" },
  { value: "service_account", label: "Service Account" },
  { value: "api_key", label: "API Key" },
];

const FLOW_TYPE_DESCRIPTIONS: Record<string, string> = {
  client_credentials:
    "Langflow exchanges client ID + secret at the token URL (no user login).",
  authorization_code:
    "User signs in at the provider; tokens come from an authorization-code exchange.",
  service_account:
    "Paste a Google service-account JSON key; Langflow uses JWT bearer.",
  api_key: "Paste a provider token or PAT; Langflow sends it as credentials.", // pragma: allowlist secret
};

const FLOW_TYPE_LABELS: Record<string, string> = {
  client_credentials: "Client Credentials",
  authorization_code: "Authorization Code",
  service_account: "Service Account",
  api_key: "API Key", // pragma: allowlist secret
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function oauthConsoleSuggestions(): {
  authorizedJavaScriptOrigin: string;
  redirectUriCandidates: string[];
  callbackUri: string;
} {
  if (typeof window === "undefined") {
    return {
      authorizedJavaScriptOrigin: "",
      redirectUriCandidates: [],
      callbackUri: "",
    };
  }

  const authorizedJavaScriptOrigin = window.location.origin;

  let apiSideOrigin = authorizedJavaScriptOrigin;
  try {
    if (/^https?:\/\//i.test(BASE_URL_API)) {
      apiSideOrigin = new URL(BASE_URL_API).origin;
    } else {
      const here = new URL(authorizedJavaScriptOrigin);
      if (
        here.hostname === "localhost" &&
        here.port !== "" &&
        here.port !== "7860"
      ) {
        apiSideOrigin = new URL(PROXY_TARGET).origin;
      }
    }
  } catch {
    apiSideOrigin = authorizedJavaScriptOrigin;
  }

  const callbackUri = `${apiSideOrigin}/api/v1/oauth_providers/callback`;
  const redirectUriCandidates = Array.from(
    new Set([
      callbackUri,
      ...(apiSideOrigin === authorizedJavaScriptOrigin
        ? []
        : [`${authorizedJavaScriptOrigin}/api/v1/oauth_providers/callback`]),
    ]),
  );

  return { authorizedJavaScriptOrigin, redirectUriCandidates, callbackUri };
}

/** Select option values in seconds; API stores `auto_refresh_interval_minutes`. */
const OAUTH_AUTO_REFRESH_INTERVAL_SECONDS = [
  60, 300, 900, 1800, 3600, 21600, 43200, 86400,
] as const;

function formatOAuthAutoRefreshLabel(intervalMinutes: number): string {
  if (intervalMinutes <= 0) return "";
  if (intervalMinutes < 60) {
    return intervalMinutes === 1
      ? "Every 1 minute"
      : `Every ${intervalMinutes} minutes`;
  }
  if (intervalMinutes % 60 === 0) {
    const hours = intervalMinutes / 60;
    return hours === 1 ? "Every 1 hour" : `Every ${hours} hours`;
  }
  return `Every ${intervalMinutes} minutes`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OAuthCopyRow({
  label,
  value,
  onCopied,
}: {
  label: string;
  value: string;
  onCopied: (text: string) => void;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <code className="break-all font-mono text-[11px] text-muted-foreground">
          {value}
        </code>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="iconSm"
        className="size-8 shrink-0"
        aria-label={`Copy ${label}`}
        onClick={() => onCopied(value)}
      >
        <ForwardedIconComponent name="Copy" className="size-4" />
      </Button>
    </div>
  );
}

function OAuthStepper({
  steps,
  activeStep,
  onStepClick,
}: {
  steps: readonly { number: number; label: string }[];
  activeStep: number;
  onStepClick?: (step: number) => void;
}) {
  const progressPercent =
    steps.length > 1 ? ((activeStep - 1) / (steps.length - 1)) * 100 : 0;
  // Offset the bar so it starts/ends at each circle's center regardless of label width.
  // Each step is flex-1, so its center is at (100% / (2 * N)) from the edge.
  const edgeOffset = `${100 / (2 * steps.length)}%`;
  return (
    <div className="relative mx-auto h-[52px] w-full max-w-[700px]">
      <div
        className="absolute top-4 h-[2px] bg-muted"
        style={{ left: edgeOffset, right: edgeOffset }}
      >
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="relative flex h-full items-start">
        {steps.map((s) => {
          const isActive = activeStep >= s.number;
          const isClickable = !!onStepClick && s.number < activeStep;
          return (
            <div
              key={s.number}
              className={cn(
                "flex flex-1 flex-col items-center gap-1",
                isClickable && "cursor-pointer",
              )}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={isClickable ? () => onStepClick(s.number) : undefined}
              onKeyDown={
                isClickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ")
                        onStepClick(s.number);
                    }
                  : undefined
              }
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {s.number}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-xs text-foreground",
                  isActive && "font-medium",
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OAuthConsolePanel({
  hints,
  onCopied,
}: {
  hints: ReturnType<typeof oauthConsoleSuggestions>;
  onCopied: (text: string, label: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Register these URLs in your OAuth provider's console before connecting.
        Without the correct redirect URI, authorization will fail.
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Authorized Redirect URIs
          </p>
          <div className="flex flex-col gap-2">
            {hints.redirectUriCandidates.map((uri) => (
              <OAuthCopyRow
                key={uri}
                label="Authorized redirect URI"
                value={uri}
                onCopied={(t) => onCopied(t, "Authorized redirect URI")}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Authorized JavaScript Origins
          </p>
          <div className="flex flex-col gap-2">
            <OAuthCopyRow
              label="Authorized JavaScript origin"
              value={hints.authorizedJavaScriptOrigin}
              onCopied={(t) => onCopied(t, "Authorized JavaScript origin")}
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
        <ForwardedIconComponent
          name="Info"
          className="mb-0.5 mr-1 inline h-3.5 w-3.5"
        />
        In your Google Cloud Console go to{" "}
        <strong>
          APIs &amp; Services → Credentials → OAuth 2.0 Client IDs
        </strong>{" "}
        and add these values under the respective fields.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Credentials form (shared between create step 3 and edit settings tab)
// ---------------------------------------------------------------------------

interface CredentialsFormProps {
  isEditMode: boolean;
  flowType: string;
  clientId: string;
  setClientId: (v: string) => void;
  clientSecret: string;
  setClientSecret: (v: string) => void;
  extraData: string;
  setExtraData: (v: string) => void;
  scopes: string;
  setScopes: (v: string) => void;
  authEndpoint: string;
  setAuthEndpoint: (v: string) => void;
  tokenEndpoint: string;
  setTokenEndpoint: (v: string) => void;
  userinfoEndpoint: string;
  setUserinfoEndpoint: (v: string) => void;
}

function CredentialsForm({
  isEditMode,
  flowType,
  clientId,
  setClientId,
  clientSecret,
  setClientSecret,
  extraData,
  setExtraData,
  scopes,
  setScopes,
  authEndpoint,
  setAuthEndpoint,
  tokenEndpoint,
  setTokenEndpoint,
  userinfoEndpoint,
  setUserinfoEndpoint,
}: CredentialsFormProps) {
  const showServiceAccountField = flowType === "service_account";
  const showClientFields = flowType !== "service_account";
  const isAuthCodeFlow = flowType === "authorization_code";

  return (
    <div className="flex flex-col gap-4">
      {/* Client ID / Secret – not shown for service accounts */}
      {showClientFields && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="oauth-client-id">Client ID</Label>
            <Input
              id="oauth-client-id"
              placeholder={
                isEditMode ? "Leave empty to keep current" : "your-client-id"
              }
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="oauth-client-secret">
              {flowType === "api_key" ? "API Token / Secret" : "Client Secret"}
            </Label>
            <Input
              id="oauth-client-secret"
              type="password"
              placeholder={
                isEditMode ? "Leave empty to keep current" : "••••••••"
              }
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Service account JSON */}
      {showServiceAccountField && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oauth-extra-data">Service Account JSON</Label>
          <Textarea
            id="oauth-extra-data"
            placeholder={
              isEditMode
                ? "Leave empty to keep current (or upload a JSON file above)"
                : "Paste contents of service account key JSON…"
            }
            className="h-28 font-mono text-xs"
            value={extraData}
            onChange={(e) => setExtraData(e.target.value)}
          />
        </div>
      )}

      {/* Scopes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="oauth-scopes">
          Scopes{" "}
          <span className="text-xs text-muted-foreground">
            (space or comma separated)
          </span>
        </Label>
        <Input
          id="oauth-scopes"
          placeholder="e.g. openid email profile"
          value={scopes}
          onChange={(e) => setScopes(e.target.value)}
        />
      </div>

      {/* Authorization endpoint — only for authorization_code */}
      {isAuthCodeFlow && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oauth-auth-endpoint">Authorization Endpoint</Label>
          <Input
            id="oauth-auth-endpoint"
            placeholder="https://accounts.google.com/o/oauth2/v2/auth"
            value={authEndpoint}
            onChange={(e) => setAuthEndpoint(e.target.value)}
          />
        </div>
      )}

      {/* Token endpoint */}
      {flowType !== "api_key" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oauth-token-endpoint">Token Endpoint</Label>
          <Input
            id="oauth-token-endpoint"
            placeholder="https://..."
            value={tokenEndpoint}
            onChange={(e) => setTokenEndpoint(e.target.value)}
          />
        </div>
      )}

      {/* Userinfo endpoint */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="oauth-userinfo-endpoint">
          Validation URL{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="oauth-userinfo-endpoint"
          placeholder="https://..."
          value={userinfoEndpoint}
          onChange={(e) => setUserinfoEndpoint(e.target.value)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

interface OAuthProviderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "create" | "edit";
  initialData?: IOAuthProviderRead;
}

export default function AddOAuthProviderModal({
  open,
  onClose,
  onSuccess,
  mode = "create",
  initialData,
}: OAuthProviderModalProps) {
  const isEditMode = mode === "edit";

  const setErrorData = useAlertStore((state) => state.setErrorData);
  const setSuccessData = useAlertStore((state) => state.setSuccessData);

  const { data: rawProviders = [] } = useGetOAuthProviderTypesQuery();
  const providers = rawProviders.filter((p) =>
    (SUPPORTED_PROVIDER_IDS as readonly string[]).includes(p.id),
  );
  const { mutate: postAccount, isPending: isPosting } = usePostOAuthProvider();
  const { mutate: patchAccount, isPending: isPatching } =
    usePatchOAuthProvider();
  const { mutate: validateAccount, isPending: isValidating } =
    useValidateOAuthProvider();
  const { mutate: rotateAccount, isPending: isRotating } =
    useRotateOAuthProvider();
  const { mutate: authorizeAccount, isPending: isAuthorizing } =
    useAuthorizeOAuthProvider();

  const isPending = isPosting || isPatching;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const oauthConsoleHints = useMemo(() => oauthConsoleSuggestions(), [open]);

  const copyConsoleValue = useCallback(
    (text: string, labelShort: string) => {
      if (!navigator.clipboard?.writeText) {
        setErrorData({ title: "Clipboard not supported in this browser" });
        return;
      }
      void navigator.clipboard.writeText(text).then(() => {
        setSuccessData({ title: `Copied ${labelShort}` });
      });
    },
    [setErrorData, setSuccessData],
  );

  // Form fields
  const [name, setName] = useState("");
  const [providerId, setProviderId] = useState("google");
  const [flowType, setFlowType] = useState("service_account");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [scopes, setScopes] = useState("");
  const [authEndpoint, setAuthEndpoint] = useState("");
  const [tokenEndpoint, setTokenEndpoint] = useState("");
  const [userinfoEndpoint, setUserinfoEndpoint] = useState("");
  const [extraData, setExtraData] = useState("");

  // Save / connection state
  const [savedAccountId, setSavedAccountId] = useState<string | null>(null);
  const [lastSavedData, setLastSavedData] = useState<IOAuthProviderRead | null>(
    null,
  );
  const [validationResult, setValidationResult] =
    useState<IValidateConnectionResponse | null>(null);
  const [rotationResult, setRotationResult] =
    useState<IRotateTokensResponse | null>(null);
  const [connectStatus, setConnectStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [connectError, setConnectError] = useState<string | null>(null);

  // Wizard step (create mode only): 1 = Provider & Flow, 2 = Import, 3 = Configure, 4 = Connect
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Edit mode active tab
  const [editTab, setEditTab] = useState<"settings" | "connection" | "console">(
    "settings",
  );

  // Auto-refresh interval stored as minutes (backend contract); select values are seconds.
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(
    null,
  );

  // Live token status — updated in-place after rotate/validate so the Connection tab
  // reflects the latest state without requiring a modal close-and-reopen.
  const [liveTokenStatus, setLiveTokenStatus] = useState<
    "valid" | "expired" | "not_connected" | "unknown"
  >("unknown");
  const [liveTokenExpiresAt, setLiveTokenExpiresAt] = useState<string | null>(
    null,
  );
  const [liveLastValidatedAt, setLiveLastValidatedAt] = useState<string | null>(
    null,
  );
  const [liveNextRefreshAt, setLiveNextRefreshAt] = useState<string | null>(
    null,
  );
  const [liveLastUsedAt, setLiveLastUsedAt] = useState<string | null>(null);
  const [liveCreatedAt, setLiveCreatedAt] = useState<string | null>(null);
  const [manualRefreshState, setManualRefreshState] = useState<{
    refreshedAt: string;
    previousStatus: "valid" | "expired" | "not_connected" | "unknown";
    previousExpiresAt: string | null;
    newExpiresAt: string | null;
    message: string;
  } | null>(null);

  const { refetch: refetchOAuthProviders } = useGetOAuthProvidersQuery({
    enabled: false,
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) return;

    if (isEditMode && initialData) {
      setName(initialData.name);
      setProviderId(initialData.provider);
      setFlowType(initialData.flow_type);
      setClientId("");
      setClientSecret("");
      setScopes((initialData.scopes ?? []).join(" "));
      setAuthEndpoint(initialData.auth_endpoint ?? "");
      setTokenEndpoint(initialData.token_endpoint ?? "");
      setUserinfoEndpoint(initialData.userinfo_endpoint ?? "");
      setExtraData("");
      setSavedAccountId(null);
      setLastSavedData(initialData);
      setValidationResult(null);
      setRotationResult(null);
      setConnectStatus(
        initialData.token_status === "valid" ? "success" : "idle",
      );
      setConnectError(null);
      setEditTab("settings");
      setAutoRefreshInterval(initialData.auto_refresh_interval_minutes ?? null);
      setLiveTokenStatus(initialData.token_status);
      setLiveTokenExpiresAt(initialData.token_expires_at);
      setLiveLastValidatedAt(initialData.last_validated_at);
      setLiveNextRefreshAt(initialData.next_refresh_at ?? null);
      setLiveLastUsedAt(initialData.last_used_at);
      setLiveCreatedAt(initialData.created_at);
      setManualRefreshState(null);
    } else if (!isEditMode) {
      setName("");
      setProviderId("google");
      setFlowType("service_account");
      setClientId("");
      setClientSecret("");
      setScopes("");
      setAuthEndpoint("");
      setTokenEndpoint("");
      setUserinfoEndpoint("");
      setExtraData("");
      setSavedAccountId(null);
      setLastSavedData(null);
      setValidationResult(null);
      setRotationResult(null);
      setConnectStatus("idle");
      setConnectError(null);
      setStep(1);
      setAutoRefreshInterval(null);
      setLiveTokenStatus("unknown");
      setLiveTokenExpiresAt(null);
      setLiveLastValidatedAt(null);
      setLiveNextRefreshAt(null);
      setLiveLastUsedAt(null);
      setLiveCreatedAt(null);
      setManualRefreshState(null);
    }
  }, [open, isEditMode, initialData]);

  const isDirty = lastSavedData
    ? name !== lastSavedData.name ||
      scopes !== (lastSavedData.scopes ?? []).join(" ") ||
      authEndpoint !== (lastSavedData.auth_endpoint ?? "") ||
      tokenEndpoint !== (lastSavedData.token_endpoint ?? "") ||
      userinfoEndpoint !== (lastSavedData.userinfo_endpoint ?? "") ||
      clientId !== "" ||
      clientSecret !== "" ||
      extraData !== "" ||
      autoRefreshInterval !==
        (lastSavedData.auto_refresh_interval_minutes ?? null)
    : true;

  const selectedProvider: IOAuthProvider | undefined = providers.find(
    (p) => p.id === providerId,
  );

  // Auto-fill provider defaults when provider changes (create mode only)
  useEffect(() => {
    if (isEditMode) return;
    if (selectedProvider) {
      setAuthEndpoint(selectedProvider.default_auth_endpoint ?? "");
      setTokenEndpoint(selectedProvider.default_token_endpoint ?? "");
      setUserinfoEndpoint(selectedProvider.default_userinfo_endpoint ?? "");
      setScopes((selectedProvider.default_scopes ?? []).join(" "));
      const firstFlow = selectedProvider.supported_flows?.[0];
      if (firstFlow) setFlowType(firstFlow);
    }
  }, [providerId, selectedProvider, isEditMode]);

  const supportedFlows = isEditMode
    ? FLOW_TYPE_OPTIONS.map((f) => f.value)
    : (selectedProvider?.supported_flows ??
      FLOW_TYPE_OPTIONS.map((f) => f.value));

  const hint =
    selectedProvider?.hints?.[flowType] ??
    selectedProvider?.hints?.["token_endpoint"];

  const parsedScopes = scopes
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isAuthCodeFlow = flowType === "authorization_code";

  const WIZARD_STEPS = [
    { number: 1, label: "Provider & Flow" },
    { number: 2, label: "Import" },
    { number: 3, label: "Configure" },
    { number: 4, label: "Connect" },
  ] as const;

  async function refreshLiveAccountState(
    accountId: string,
    options?: { preserveValidStatus?: boolean },
  ) {
    try {
      const refreshed = await refetchOAuthProviders();
      const account = refreshed.data?.accounts?.find((a) => a.id === accountId);
      if (!account) return;

      setLastSavedData((current) =>
        current && current.id === account.id ? account : current,
      );
      setAutoRefreshInterval(account.auto_refresh_interval_minutes ?? null);
      setLiveTokenStatus((currentStatus) => {
        if (
          options?.preserveValidStatus &&
          currentStatus === "valid" &&
          account.token_status === "expired"
        ) {
          return currentStatus;
        }
        return account.token_status;
      });
      setLiveTokenExpiresAt(account.token_expires_at);
      setLiveLastValidatedAt(account.last_validated_at);
      setLiveNextRefreshAt(account.next_refresh_at ?? null);
      setLiveLastUsedAt(account.last_used_at);
      setLiveCreatedAt(account.created_at);
    } catch {
      // Best-effort refresh for live status panel.
    }
  }

  // Poll the backend for live token status updates while the modal is open.
  // This ensures the token status display reflects background auto-refreshes.
  const liveAccountId = isEditMode
    ? (savedAccountId ?? initialData?.id ?? null)
    : savedAccountId;

  useEffect(() => {
    if (!open || !liveAccountId) return;

    // Determine polling interval: slightly faster than the auto-refresh interval
    // so changes are visible promptly after they happen (min 30 s, max 60 s).
    const intervalMs = autoRefreshInterval
      ? Math.min(60_000, Math.max(30_000, autoRefreshInterval * 60_000 * 0.25))
      : 60_000;

    const timer = setInterval(() => {
      refreshLiveAccountState(liveAccountId);
    }, intervalMs);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, liveAccountId, autoRefreshInterval]);

  function goToNextStep() {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  }

  function goToPrevStep() {
    if (step === 4) setStep(3);
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  // -----------------------------------------------------------------------
  // JSON file import
  // -----------------------------------------------------------------------
  function handleJsonFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const json = JSON.parse(raw);

        // Google service account JSON
        if (json.type === "service_account") {
          setExtraData(raw);
          if (json.token_uri) setTokenEndpoint(json.token_uri);
          if (!isEditMode) {
            setProviderId("google");
            setFlowType("service_account");
            if (!name) setName(json.project_id ?? "");
          }
          setSuccessData({ title: "Service Account JSON imported" });
          if (!isEditMode) setStep(3);
          return;
        }

        // Google OAuth2 client_secret JSON (web or installed)
        const app = json.web ?? json.installed;
        if (app?.client_id) {
          setClientId(app.client_id);
          if (app.client_secret) setClientSecret(app.client_secret);
          if (app.token_uri) setTokenEndpoint(app.token_uri);
          if (app.auth_uri) setAuthEndpoint(app.auth_uri);
          if (!isEditMode) {
            setProviderId("google");
            setFlowType("authorization_code");
            if (!name)
              setName(json.web?.project_id ?? json.installed?.project_id ?? "");
          }
          setSuccessData({ title: "Client Secret JSON imported" });
          if (!isEditMode) setStep(3);
          return;
        }

        setErrorData({
          title: "Unrecognised JSON format",
          list: [
            "Expected a Google client_secret or service_account JSON file.",
          ],
        });
      } catch {
        setErrorData({ title: "Failed to parse JSON file" });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------
  function handleSubmit() {
    if (!name.trim()) {
      setErrorData({ title: "Name is required" });
      return;
    }

    if (isEditMode && initialData) {
      const updatePayload: IOAuthProviderUpdate = {
        name: name.trim(),
        scopes: parsedScopes,
        auth_endpoint: authEndpoint || null,
        token_endpoint: tokenEndpoint || null,
        userinfo_endpoint: userinfoEndpoint || null,
        auto_refresh_interval_minutes: autoRefreshInterval,
      };
      if (clientId) updatePayload.client_id = clientId;
      if (clientSecret) updatePayload.client_secret = clientSecret;
      if (extraData) updatePayload.extra_data = extraData;

      patchAccount(
        { accountId: initialData.id, payload: updatePayload },
        {
          onSuccess: (result) => {
            setSavedAccountId(result.id);
            setLastSavedData(result);
            setClientId("");
            setClientSecret("");
            setExtraData("");
            setValidationResult(null);
            setRotationResult(null);
            setConnectStatus("idle");
            setConnectError(null);
            setLiveTokenStatus(result.token_status);
            setLiveTokenExpiresAt(result.token_expires_at);
            setLiveLastValidatedAt(result.last_validated_at);
            setLiveNextRefreshAt(result.next_refresh_at ?? null);
            setLiveLastUsedAt(result.last_used_at);
            setLiveCreatedAt(result.created_at);
            setManualRefreshState(null);
            onSuccess();
          },
          onError: (err: unknown) => {
            setErrorData({
              title: "Failed to update OAuth account",
              list: [
                (err as ApiError)?.response?.data?.detail ??
                  (err as ApiError)?.message,
              ],
            });
          },
        },
      );
    } else {
      postAccount(
        {
          name: name.trim(),
          provider: providerId,
          flow_type: flowType,
          client_id: clientId || null,
          client_secret: clientSecret || null,
          scopes: parsedScopes,
          auth_endpoint: authEndpoint || null,
          token_endpoint: tokenEndpoint || null,
          userinfo_endpoint: userinfoEndpoint || null,
          extra_data: extraData || null,
        },
        {
          onSuccess: (result) => {
            setSavedAccountId(result.id);
            setLastSavedData(result);
            setClientId("");
            setClientSecret("");
            setExtraData("");
            setValidationResult(null);
            setConnectStatus("idle");
            setConnectError(null);
            setLiveTokenStatus(result.token_status);
            setLiveTokenExpiresAt(result.token_expires_at);
            setLiveLastValidatedAt(result.last_validated_at);
            setLiveNextRefreshAt(result.next_refresh_at ?? null);
            setLiveLastUsedAt(result.last_used_at);
            setLiveCreatedAt(result.created_at);
            setManualRefreshState(null);
            onSuccess();
            setStep(4);
          },
          onError: (err: unknown) => {
            setErrorData({
              title: "Failed to create OAuth account",
              list: [
                (err as ApiError)?.response?.data?.detail ??
                  (err as ApiError)?.message,
              ],
            });
          },
        },
      );
    }
  }

  // -----------------------------------------------------------------------
  // Validate
  // -----------------------------------------------------------------------
  function handleValidate() {
    const accountId = savedAccountId ?? initialData?.id;
    if (!accountId) return;
    setValidationResult(null);
    validateAccount(
      { accountId },
      {
        onSuccess: (result) => {
          setValidationResult(result);
          if (result.success) {
            setLiveLastValidatedAt(new Date().toISOString());
            setLiveTokenStatus("valid");
            setManualRefreshState(null);
            void refreshLiveAccountState(accountId);
          }
        },
        onError: (err: unknown) => {
          setValidationResult({
            success: false,
            message:
              (err as ApiError)?.response?.data?.detail ??
              (err as ApiError)?.message ??
              "Unknown error",
          });
        },
      },
    );
  }

  // -----------------------------------------------------------------------
  // Rotate tokens
  // -----------------------------------------------------------------------
  function handleRotate() {
    const accountId = savedAccountId ?? initialData?.id;
    if (!accountId) return;
    const previousStatus = liveTokenStatus;
    const previousExpiresAt = liveTokenExpiresAt;
    setRotationResult(null);
    rotateAccount(
      { accountId },
      {
        onSuccess: (result) => {
          setRotationResult(result);
          if (result.success) {
            const newExpiresAt = result.token_expires_at ?? null;
            setLiveTokenExpiresAt(newExpiresAt);
            // Rotation succeeded → token is valid regardless of the returned expiry value.
            // computeTokenStatus can misreport "expired" when the backend returns a
            // past-looking timestamp (e.g. service accounts without a real TTL).
            setLiveTokenStatus("valid");
            // Recompute next refresh if interval is set
            if (autoRefreshInterval) {
              setLiveNextRefreshAt(
                new Date(
                  Date.now() + autoRefreshInterval * 60_000,
                ).toISOString(),
              );
            }
            setLiveLastValidatedAt(new Date().toISOString());
            setManualRefreshState({
              refreshedAt: new Date().toISOString(),
              previousStatus,
              previousExpiresAt,
              newExpiresAt,
              message: result.message,
            });
            void refreshLiveAccountState(accountId, {
              preserveValidStatus: true,
            });
            onSuccess();
          }
        },
        onError: (err: unknown) => {
          setRotationResult({
            success: false,
            message:
              (err as ApiError)?.response?.data?.detail ??
              (err as ApiError)?.message ??
              "Unknown error",
          });
        },
      },
    );
  }

  // -----------------------------------------------------------------------
  // Authorization Code popup
  // -----------------------------------------------------------------------
  function handleConnect() {
    const accountId = savedAccountId ?? (isEditMode ? initialData?.id : null);
    if (!accountId) return;

    setConnectStatus("pending");
    setConnectError(null);

    authorizeAccount(
      { accountId },
      {
        onSuccess: ({ authorization_url }) => {
          const popup = window.open(
            authorization_url,
            "oauth_popup",
            "width=600,height=700,left=200,top=100,resizable=yes,scrollbars=yes",
          );

          if (!popup) {
            setConnectStatus("error");
            setConnectError(
              "Popup was blocked by the browser. Allow popups for this site and try again.",
            );
            return;
          }

          const handler = (event: MessageEvent) => {
            if (event.data?.type !== "oauth_callback") return;
            window.removeEventListener("message", handler);
            if (event.data.success) {
              setConnectStatus("success");
              onSuccess();
            } else {
              setConnectStatus("error");
              setConnectError(event.data.error ?? "Authorization failed");
            }
          };
          window.addEventListener("message", handler);

          const pollTimer = setInterval(() => {
            if (popup.closed) {
              clearInterval(pollTimer);
              window.removeEventListener("message", handler);
              setConnectStatus((prev) => (prev === "pending" ? "idle" : prev));
            }
          }, 500);
        },
        onError: (err: unknown) => {
          setConnectStatus("error");
          setConnectError(
            (err as ApiError)?.response?.data?.detail ??
              (err as ApiError)?.message ??
              null,
          );
        },
      },
    );
  }

  const validateTargetId =
    savedAccountId ?? (isEditMode ? initialData?.id : null);
  const connectTargetId =
    savedAccountId ?? (isEditMode ? initialData?.id : null);
  const hasRecentlyRefreshed = !!manualRefreshState;

  // -----------------------------------------------------------------------
  // Shared: connect + validate panels (used in both edit and create step 3)
  // -----------------------------------------------------------------------
  function renderConnectSection() {
    if (!isAuthCodeFlow || !connectTargetId) return null;
    const isConnected = connectStatus === "success";
    return (
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              {isConnected && (
                <ForwardedIconComponent
                  name="CheckCircle"
                  className="h-4 w-4 text-green-600 dark:text-green-400"
                />
              )}
              <p className="text-sm font-medium">
                {isConnected ? "Account connected" : "Connect Account"}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isConnected
                ? "Your account is authorized and active."
                : "Opens the provider sign-in in a popup window."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {isConnected ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  isAuthorizing || connectStatus === "pending" || isDirty
                }
                onClick={handleConnect}
              >
                {isAuthorizing || connectStatus === "pending" ? (
                  <>
                    <ForwardedIconComponent
                      name="Loader"
                      className="mr-1 h-3.5 w-3.5 animate-spin"
                    />
                    Opening…
                  </>
                ) : (
                  <>
                    <ForwardedIconComponent
                      name="RefreshCw"
                      className="mr-1 h-3.5 w-3.5"
                    />
                    Reconnect
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={
                  isAuthorizing || connectStatus === "pending" || isDirty
                }
                onClick={handleConnect}
              >
                {isAuthorizing || connectStatus === "pending" ? (
                  <>
                    <ForwardedIconComponent
                      name="Loader"
                      className="mr-1 h-3.5 w-3.5 animate-spin"
                    />
                    Opening…
                  </>
                ) : (
                  <>
                    <ForwardedIconComponent
                      name="LogIn"
                      className="mr-1 h-3.5 w-3.5"
                    />
                    Connect
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {isDirty && (
          <div className="text-[11px] text-amber-600 dark:text-amber-400">
            Save your changes before connecting.
          </div>
        )}

        {connectStatus === "error" && connectError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            <ForwardedIconComponent
              name="XCircle"
              className="mr-1 inline h-3.5 w-3.5"
            />
            {connectError}
          </div>
        )}
      </div>
    );
  }

  function renderValidateSection() {
    if (!validateTargetId) return null;
    return (
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Test Connection</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isValidating || isDirty}
            onClick={handleValidate}
          >
            {isValidating ? (
              <>
                <ForwardedIconComponent
                  name="Loader"
                  className="mr-1 h-3.5 w-3.5 animate-spin"
                />
                Validating…
              </>
            ) : (
              <>
                <ForwardedIconComponent
                  name="ShieldCheck"
                  className="mr-1 h-3.5 w-3.5"
                />
                Validate Connection
              </>
            )}
          </Button>
        </div>

        {isDirty && (
          <div className="text-[11px] text-amber-600 dark:text-amber-400">
            Save your changes before validating.
          </div>
        )}

        {validationResult && (
          <div
            className={`rounded-md p-2 text-xs ${
              validationResult.success
                ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                : "border border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            <div className="flex items-start gap-1.5">
              <ForwardedIconComponent
                name={validationResult.success ? "CheckCircle" : "XCircle"}
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
              />
              <span>{validationResult.message}</span>
            </div>
            {validationResult.details &&
              Object.keys(validationResult.details).length > 0 && (
                <pre
                  className={cn(
                    "mt-1.5 overflow-x-auto rounded border p-1 font-mono text-xs",
                    validationResult.success
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
                  )}
                >
                  {JSON.stringify(validationResult.details, null, 2)}
                </pre>
              )}
          </div>
        )}
      </div>
    );
  }

  function renderRotateSection() {
    const accountId = savedAccountId ?? (isEditMode ? initialData?.id : null);
    if (!accountId) return null;
    return (
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Refresh Tokens</p>
            <p className="text-[11px] text-muted-foreground">
              Rotate stored tokens using the provider's refresh endpoint.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRotating || isDirty}
            onClick={handleRotate}
          >
            {isRotating ? (
              <>
                <ForwardedIconComponent
                  name="Loader"
                  className="mr-1 h-3.5 w-3.5 animate-spin"
                />
                Refreshing…
              </>
            ) : (
              <>
                <ForwardedIconComponent
                  name="RefreshCw"
                  className="mr-1 h-3.5 w-3.5"
                />
                Refresh Tokens
              </>
            )}
          </Button>
        </div>

        {isDirty && (
          <div className="text-[11px] text-amber-600 dark:text-amber-400">
            Save your changes before refreshing tokens.
          </div>
        )}

        {rotationResult && (
          <div
            className={`rounded-md p-2 text-xs ${
              rotationResult.success
                ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                : "border border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            <div className="flex items-start gap-1.5">
              <ForwardedIconComponent
                name={rotationResult.success ? "CheckCircle" : "XCircle"}
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
              />
              <span>{rotationResult.message}</span>
            </div>
            {rotationResult.token_expires_at && (
              <p className="mt-1 text-[10px] opacity-80">
                Expires:{" "}
                {new Date(rotationResult.token_expires_at).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Edit mode — tabbed dialog
  // -----------------------------------------------------------------------
  if (isEditMode) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ForwardedIconComponent name="KeyRound" className="h-5 w-5" />
              Edit OAuth Account
            </DialogTitle>
            <DialogDescription>
              Credentials encrypted at rest.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleJsonFileChange}
          />

          <Tabs
            value={editTab}
            onValueChange={(v) =>
              setEditTab(v as "settings" | "connection" | "console")
            }
          >
            <TabsList className="border-b">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="console">Provider Setup</TabsTrigger>
            </TabsList>

            {/* ── Settings Tab ── */}
            <TabsContent value="settings">
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Re-import from JSON file
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ForwardedIconComponent
                        name="Upload"
                        className="mr-1 h-3.5 w-3.5"
                      />
                      Upload JSON
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Accepts Google <code>client_secret_*.json</code> or{" "}
                    <code>service_account.json</code> — overwrites fields below.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="oauth-name-edit">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="oauth-name-edit"
                    placeholder="e.g. My Google Cloud Project"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Provider
                    </Label>
                    <p className="text-sm font-medium">
                      {PROVIDER_LABELS[providerId as SupportedProviderId] ??
                        providerId}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Flow Type
                    </Label>
                    <p className="text-sm font-medium">
                      {FLOW_TYPE_LABELS[flowType] ?? flowType}
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                        (locked)
                      </span>
                    </p>
                  </div>
                </div>

                {hint && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <ForwardedIconComponent
                      name="Info"
                      className="mb-0.5 mr-1 inline h-3.5 w-3.5"
                    />
                    {hint}
                  </div>
                )}

                <CredentialsForm
                  isEditMode={true}
                  flowType={flowType}
                  clientId={clientId}
                  setClientId={setClientId}
                  clientSecret={clientSecret}
                  setClientSecret={setClientSecret}
                  extraData={extraData}
                  setExtraData={setExtraData}
                  scopes={scopes}
                  setScopes={setScopes}
                  authEndpoint={authEndpoint}
                  setAuthEndpoint={setAuthEndpoint}
                  tokenEndpoint={tokenEndpoint}
                  setTokenEndpoint={setTokenEndpoint}
                  userinfoEndpoint={userinfoEndpoint}
                  setUserinfoEndpoint={setUserinfoEndpoint}
                />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="oauth-auto-refresh">
                    Auto-refresh interval
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={
                        autoRefreshInterval === null
                          ? "disabled"
                          : String(autoRefreshInterval * 60)
                      }
                      onValueChange={(v) =>
                        setAutoRefreshInterval(
                          v === "disabled" ? null : Math.ceil(Number(v) / 60),
                        )
                      }
                    >
                      <SelectTrigger id="oauth-auto-refresh" className="w-full">
                        <SelectValue placeholder="Disabled" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        {OAUTH_AUTO_REFRESH_INTERVAL_SECONDS.map((sec) => (
                          <SelectItem key={sec} value={String(sec)}>
                            {formatOAuthAutoRefreshLabel(sec / 60)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Langflow will automatically rotate tokens in the background
                    at this interval. Stored values are rounded to whole
                    minutes.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Connection Tab ── */}
            <TabsContent value="connection">
              <div className="flex flex-col gap-4 py-2">
                {initialData && (
                  <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Token Status
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0">
                        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                          Status
                        </span>
                        <span
                          className={cn(
                            "inline-flex w-fit items-center gap-0.5 rounded-full px-1.5 py-0 text-[11px] font-medium",
                            hasRecentlyRefreshed
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : liveTokenStatus === "valid"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                : liveTokenStatus === "expired"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : "bg-muted text-muted-foreground",
                          )}
                        >
                          <ForwardedIconComponent
                            name={
                              hasRecentlyRefreshed
                                ? "CheckCircle"
                                : liveTokenStatus === "valid"
                                  ? "CheckCircle"
                                  : liveTokenStatus === "expired"
                                    ? "AlertCircle"
                                    : "MinusCircle"
                            }
                            className="h-2.5 w-2.5"
                          />
                          {hasRecentlyRefreshed
                            ? "Active"
                            : liveTokenStatus === "valid"
                              ? "Active"
                              : liveTokenStatus === "expired"
                                ? "Expired"
                                : liveTokenStatus === "not_connected"
                                  ? "Not connected"
                                  : "Unknown"}
                        </span>
                      </div>

                      {manualRefreshState && (
                        <div className="flex flex-col gap-0">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Previous status
                          </span>
                          <span
                            className={cn(
                              "inline-flex w-fit items-center gap-0.5 rounded-full px-1.5 py-0 text-[11px] font-medium",
                              manualRefreshState.previousStatus === "valid"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                : manualRefreshState.previousStatus ===
                                    "expired"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            <ForwardedIconComponent
                              name={
                                manualRefreshState.previousStatus === "valid"
                                  ? "CheckCircle"
                                  : manualRefreshState.previousStatus ===
                                      "expired"
                                    ? "AlertCircle"
                                    : "MinusCircle"
                              }
                              className="h-2.5 w-2.5"
                            />
                            {manualRefreshState.previousStatus === "valid"
                              ? "Active"
                              : manualRefreshState.previousStatus === "expired"
                                ? "Expired"
                                : manualRefreshState.previousStatus ===
                                    "not_connected"
                                  ? "Not connected"
                                  : "Unknown"}
                          </span>
                        </div>
                      )}

                      {liveTokenExpiresAt && (
                        <div className="flex flex-col gap-0">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Expires
                          </span>
                          <span className="text-[11px] text-foreground">
                            {new Date(liveTokenExpiresAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {manualRefreshState?.previousExpiresAt && (
                        <div className="flex flex-col gap-0">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Previous expiry
                          </span>
                          <span className="text-[11px] text-foreground">
                            {new Date(
                              manualRefreshState.previousExpiresAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {manualRefreshState && (
                        <div className="flex flex-col gap-0">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Refreshed at
                          </span>
                          <span className="text-[11px] text-foreground">
                            {new Date(
                              manualRefreshState.refreshedAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-0">
                        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                          {autoRefreshInterval
                            ? "Next auto-refresh"
                            : "Auto-refresh"}
                        </span>
                        <span
                          className={cn(
                            "text-[11px]",
                            autoRefreshInterval &&
                              liveNextRefreshAt &&
                              new Date(liveNextRefreshAt) < new Date()
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground",
                          )}
                        >
                          {!autoRefreshInterval
                            ? "Auto-refresh disabled"
                            : liveNextRefreshAt
                              ? new Date(liveNextRefreshAt) < new Date()
                                ? new Date(liveNextRefreshAt!).toLocaleString()
                                : new Date(liveNextRefreshAt).toLocaleString()
                              : formatOAuthAutoRefreshLabel(
                                  autoRefreshInterval,
                                )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {renderConnectSection()}
                {renderValidateSection()}
                {renderRotateSection()}

                {!connectTargetId && !validateTargetId && (
                  <p className="text-sm text-muted-foreground">
                    Save the account first to enable connection testing.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* ── Provider Setup Tab ── */}
            <TabsContent value="console">
              <div className="py-2">
                <OAuthConsolePanel
                  hints={oauthConsoleHints}
                  onCopied={copyConsoleValue}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              {editTab !== "settings" || validateTargetId ? "Close" : "Cancel"}
            </Button>
            {editTab === "settings" && (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isPending || !isDirty}
              >
                {isPending && (
                  <ForwardedIconComponent
                    name="Loader"
                    className="mr-1 h-4 w-4 animate-spin"
                  />
                )}
                Update Account
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // -----------------------------------------------------------------------
  // Create mode — step wizard
  // -----------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex h-[85vh] w-[700px] !max-w-none flex-col gap-0 overflow-hidden border-none bg-transparent p-0 shadow-none"
        hideCloseButton
        overlayClassName="bg-black/30 dark:bg-black/50 backdrop-blur"
      >
        <DialogTitle className="sr-only">Add OAuth Account</DialogTitle>
        <DialogDescription className="sr-only">
          Step {step} of {WIZARD_STEPS.length}
        </DialogDescription>

        {/* Hidden file input (used across steps) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleJsonFileChange}
        />

        {/* Title + Stepper */}
        <div className="flex flex-col gap-4 px-6 pt-6">
          <h2
            className="text-center text-2xl font-semibold"
            data-testid="stepper-modal-title"
          >
            Add OAuth Account
          </h2>
          <OAuthStepper steps={WIZARD_STEPS} activeStep={step} />
        </div>

        {/* Content box */}
        <div className="mx-4 mb-4 mt-4 flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-2">
            {/* ── Step 1: Provider & Flow Type ── */}
            {step === 1 && (
              <div className="flex flex-col gap-5 py-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Provider</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProviderId(p.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                          providerId === p.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
                        )}
                      >
                        <ForwardedIconComponent
                          name={p.icon}
                          className="h-4 w-4 shrink-0"
                        />
                        <span className="truncate">{p.display_name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Flow Type</Label>
                  <div className="flex flex-col gap-2">
                    {FLOW_TYPE_OPTIONS.filter((f) =>
                      supportedFlows.includes(f.value),
                    ).map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFlowType(f.value)}
                        className={cn(
                          "flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors",
                          flowType === f.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
                        )}
                      >
                        <span className="text-sm font-medium">{f.label}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {FLOW_TYPE_DESCRIPTIONS[f.value]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedProvider?.docs_url && (
                  <a
                    href={selectedProvider.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    <ForwardedIconComponent
                      name="ExternalLink"
                      className="h-3 w-3"
                    />
                    {selectedProvider.display_name} OAuth2 documentation
                  </a>
                )}
              </div>
            )}

            {/* ── Step 2: Import ── */}
            {step === 2 && (
              <div className="flex flex-col gap-4 py-2">
                {isAuthCodeFlow && (
                  <div className="rounded-md border bg-muted/30 p-3 text-xs shadow-sm dark:bg-muted/15">
                    <p className="mb-2 font-medium text-foreground">
                      Register this callback URL in your OAuth console first
                    </p>
                    <div className="flex flex-col gap-2">
                      {oauthConsoleHints.redirectUriCandidates.map((uri) => (
                        <OAuthCopyRow
                          key={uri}
                          label="Authorized redirect URI"
                          value={uri}
                          onCopied={(t) =>
                            copyConsoleValue(t, "Authorized redirect URI")
                          }
                        />
                      ))}
                      <OAuthCopyRow
                        label="Authorized JavaScript origin"
                        value={oauthConsoleHints.authorizedJavaScriptOrigin}
                        onCopied={(t) =>
                          copyConsoleValue(t, "Authorized JavaScript origin")
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Optionally import a JSON credentials file to auto-fill the
                    form, or skip ahead and enter your credentials manually.
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <ForwardedIconComponent
                      name="Upload"
                      className="h-8 w-8 text-muted-foreground"
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        Upload JSON file
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Google <code>client_secret_*.json</code> /{" "}
                        <code>service_account.json</code>
                      </p>
                    </div>
                  </button>

                  <p className="text-center text-xs text-muted-foreground">
                    Uploading auto-fills all fields and advances to the next
                    step. Use <strong>Next</strong> below to enter credentials
                    manually.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 3: Configure ── */}
            {step === 3 && (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="oauth-name-create">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="oauth-name-create"
                    placeholder="e.g. My Google Cloud Project"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {hint && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <ForwardedIconComponent
                      name="Info"
                      className="mb-0.5 mr-1 inline h-3.5 w-3.5"
                    />
                    {hint}
                  </div>
                )}

                <CredentialsForm
                  isEditMode={false}
                  flowType={flowType}
                  clientId={clientId}
                  setClientId={setClientId}
                  clientSecret={clientSecret}
                  setClientSecret={setClientSecret}
                  extraData={extraData}
                  setExtraData={setExtraData}
                  scopes={scopes}
                  setScopes={setScopes}
                  authEndpoint={authEndpoint}
                  setAuthEndpoint={setAuthEndpoint}
                  tokenEndpoint={tokenEndpoint}
                  setTokenEndpoint={setTokenEndpoint}
                  userinfoEndpoint={userinfoEndpoint}
                  setUserinfoEndpoint={setUserinfoEndpoint}
                />
              </div>
            )}

            {/* ── Step 4: Connect ── */}
            {step === 4 && (
              <div className="flex flex-col gap-4 py-2">
                {lastSavedData && (
                  <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Token Status
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0">
                        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                          Status
                        </span>
                        <span
                          className={cn(
                            "inline-flex w-fit items-center gap-0.5 rounded-full px-1.5 py-0 text-[11px] font-medium",
                            hasRecentlyRefreshed
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : liveTokenStatus === "valid"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                : liveTokenStatus === "expired"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : "bg-muted text-muted-foreground",
                          )}
                        >
                          <ForwardedIconComponent
                            name={
                              hasRecentlyRefreshed
                                ? "CheckCircle"
                                : liveTokenStatus === "valid"
                                  ? "CheckCircle"
                                  : liveTokenStatus === "expired"
                                    ? "AlertCircle"
                                    : "MinusCircle"
                            }
                            className="h-2.5 w-2.5"
                          />
                          {hasRecentlyRefreshed
                            ? "Active"
                            : liveTokenStatus === "valid"
                              ? "Active"
                              : liveTokenStatus === "expired"
                                ? "Expired"
                                : liveTokenStatus === "not_connected"
                                  ? "Not connected"
                                  : "Unknown"}
                        </span>
                      </div>

                      {manualRefreshState && (
                        <div className="flex flex-col gap-0">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Previous status
                          </span>
                          <span
                            className={cn(
                              "inline-flex w-fit items-center gap-0.5 rounded-full px-1.5 py-0 text-[11px] font-medium",
                              manualRefreshState.previousStatus === "valid"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                : manualRefreshState.previousStatus ===
                                    "expired"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            <ForwardedIconComponent
                              name={
                                manualRefreshState.previousStatus === "valid"
                                  ? "CheckCircle"
                                  : manualRefreshState.previousStatus ===
                                      "expired"
                                    ? "AlertCircle"
                                    : "MinusCircle"
                              }
                              className="h-2.5 w-2.5"
                            />
                            {manualRefreshState.previousStatus === "valid"
                              ? "Active"
                              : manualRefreshState.previousStatus === "expired"
                                ? "Expired"
                                : manualRefreshState.previousStatus ===
                                    "not_connected"
                                  ? "Not connected"
                                  : "Unknown"}
                          </span>
                        </div>
                      )}

                      {liveTokenExpiresAt && (
                        <div className="flex flex-col gap-0">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Expires
                          </span>
                          <span className="text-[11px] text-foreground">
                            {new Date(liveTokenExpiresAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {manualRefreshState?.previousExpiresAt && (
                        <div className="flex flex-col gap-0">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Previous expiry
                          </span>
                          <span className="text-[11px] text-foreground">
                            {new Date(
                              manualRefreshState.previousExpiresAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {manualRefreshState && (
                        <div className="flex flex-col gap-0">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Refreshed at
                          </span>
                          <span className="text-[11px] text-foreground">
                            {new Date(
                              manualRefreshState.refreshedAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-0">
                        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                          {autoRefreshInterval
                            ? "Next auto-refresh"
                            : "Auto-refresh"}
                        </span>
                        <span
                          className={cn(
                            "text-[11px]",
                            autoRefreshInterval &&
                              liveNextRefreshAt &&
                              new Date(liveNextRefreshAt) < new Date()
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground",
                          )}
                        >
                          {!autoRefreshInterval
                            ? "Auto-refresh disabled"
                            : liveNextRefreshAt
                              ? new Date(liveNextRefreshAt) < new Date()
                                ? `Scheduled for ${new Date(
                                    liveNextRefreshAt,
                                  ).toLocaleString()} (pending)`
                                : new Date(liveNextRefreshAt).toLocaleString()
                              : formatOAuthAutoRefreshLabel(
                                  autoRefreshInterval,
                                )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {renderConnectSection()}
                {renderValidateSection()}
                {renderRotateSection()}

                {!connectTargetId && !validateTargetId && (
                  <p className="text-sm text-muted-foreground">
                    Save the account first to enable connection testing.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            {step === 4 ? (
              <div />
            ) : (
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            )}
            <div className="flex items-center gap-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={goToPrevStep}
                  disabled={isPending}
                >
                  Back
                </Button>
              )}
              {(step === 1 || step === 2) && (
                <Button onClick={goToNextStep} data-testid="oauth-stepper-next">
                  Next
                </Button>
              )}
              {step === 3 && (
                <>
                  {savedAccountId ? (
                    <Button
                      onClick={goToNextStep}
                      data-testid="oauth-stepper-next"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isPending}
                      data-testid="oauth-stepper-next"
                    >
                      {isPending && (
                        <ForwardedIconComponent
                          name="Loader"
                          className="h-4 w-4 animate-spin"
                        />
                      )}
                      Save & Connect
                    </Button>
                  )}
                </>
              )}
              {step === 4 && <Button onClick={onClose}>Done</Button>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
