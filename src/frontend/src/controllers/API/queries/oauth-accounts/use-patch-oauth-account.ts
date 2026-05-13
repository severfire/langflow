import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { IOAuthAccountRead } from "./use-get-oauth-accounts";

export interface IOAuthAccountUpdate {
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

interface IPatchOAuthAccount {
  accountId: string;
  payload: IOAuthAccountUpdate;
}

export const usePatchOAuthAccount: useMutationFunctionType<
  undefined,
  IPatchOAuthAccount
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const patchOAuthAccountFn = async (
    payload: IPatchOAuthAccount,
  ): Promise<IOAuthAccountRead> => {
    const res = await api.patch<IOAuthAccountRead>(
      `${getURL("OAUTH_ACCOUNTS")}/${payload.accountId}`,
      payload.payload,
    );
    return res.data;
  };

  return mutate(["usePatchOAuthAccount"], patchOAuthAccountFn, options);
};
