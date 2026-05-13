import type { useQueryFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface IOAuthProvider {
  id: string;
  display_name: string;
  icon: string;
  default_auth_endpoint: string | null;
  default_token_endpoint: string | null;
  default_userinfo_endpoint: string | null;
  default_scopes: string[];
  supported_flows: string[];
  docs_url: string | null;
  hints: Record<string, string>;
}

export const useGetOAuthProvidersQuery: useQueryFunctionType<
  undefined,
  IOAuthProvider[]
> = (options) => {
  const { query } = UseRequestProcessor();

  const getProvidersFn = async () => {
    return await api.get<IOAuthProvider[]>(
      `${getURL("OAUTH_ACCOUNTS")}/providers`,
    );
  };

  const responseFn = async () => {
    const { data } = await getProvidersFn();
    return data;
  };

  return query(["useGetOAuthProvidersQuery"], responseFn, {
    staleTime: Infinity,
    ...options,
  });
};
