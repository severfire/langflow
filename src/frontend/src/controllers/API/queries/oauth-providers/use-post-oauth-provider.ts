import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { IOAuthProviderRead } from "./use-get-oauth-providers";

export interface IOAuthProviderCreate {
  name: string;
  provider: string;
  flow_type: string;
  client_id?: string | null;
  client_secret?: string | null;
  scopes?: string[];
  auth_endpoint?: string | null;
  token_endpoint?: string | null;
  userinfo_endpoint?: string | null;
  extra_data?: string | null;
}

export const usePostOAuthProvider: useMutationFunctionType<
  undefined,
  IOAuthProviderCreate
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const postOAuthProviderFn = async (
    payload: IOAuthProviderCreate,
  ): Promise<IOAuthProviderRead> => {
    const res = await api.post<IOAuthProviderRead>(
      `${getURL("OAUTH_PROVIDERS")}/`,
      payload,
    );
    return res.data;
  };

  return mutate(["usePostOAuthProvider"], postOAuthProviderFn, options);
};
