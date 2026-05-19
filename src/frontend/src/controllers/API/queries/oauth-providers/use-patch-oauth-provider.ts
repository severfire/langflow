import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { IOAuthProviderRead } from "./use-get-oauth-providers";

export interface IOAuthProviderUpdate {
  name?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  scopes?: string[];
  auth_endpoint?: string | null;
  token_endpoint?: string | null;
  userinfo_endpoint?: string | null;
  extra_data?: string | null;
  is_active?: boolean | null;
  auto_refresh_interval_minutes?: number | null;
}

interface IPatchOAuthProvider {
  accountId: string;
  payload: IOAuthProviderUpdate;
}

export const usePatchOAuthProvider: useMutationFunctionType<
  undefined,
  IPatchOAuthProvider
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const patchOAuthProviderFn = async (
    payload: IPatchOAuthProvider,
  ): Promise<IOAuthProviderRead> => {
    const res = await api.patch<IOAuthProviderRead>(
      `${getURL("OAUTH_PROVIDERS")}/${payload.accountId}`,
      payload.payload,
    );
    return res.data;
  };

  return mutate(["usePatchOAuthProvider"], patchOAuthProviderFn, options);
};
