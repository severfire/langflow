import type { useQueryFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface IOAuthProviderRead {
  id: string;
  user_id: string;
  name: string;
  provider: string;
  flow_type: string;
  client_id_masked: string | null;
  scopes: string[];
  auth_endpoint: string | null;
  token_endpoint: string | null;
  userinfo_endpoint: string | null;
  token_status: "valid" | "expired" | "not_connected" | "unknown";
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  last_validated_at: string | null;
  auto_refresh_interval_minutes: number | null;
  next_refresh_at: string | null;
}

export interface IOAuthProvidersListResponse {
  total_count: number;
  accounts: IOAuthProviderRead[];
}

export const useGetOAuthProvidersQuery: useQueryFunctionType<
  undefined,
  IOAuthProvidersListResponse
> = (options) => {
  const { query } = UseRequestProcessor();

  const getOAuthProvidersFn = async () => {
    return await api.get<IOAuthProvidersListResponse>(
      `${getURL("OAUTH_PROVIDERS")}/`,
    );
  };

  const responseFn = async () => {
    const { data } = await getOAuthProvidersFn();
    return data;
  };

  return query(["useGetOAuthProvidersQuery"], responseFn, { ...options });
};
