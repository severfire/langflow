import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { IOAuthAccountRead } from "./use-get-oauth-accounts";

export interface IOAuthAccountCreate {
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

export const usePostOAuthAccount: useMutationFunctionType<
  undefined,
  IOAuthAccountCreate
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const postOAuthAccountFn = async (
    payload: IOAuthAccountCreate,
  ): Promise<IOAuthAccountRead> => {
    const res = await api.post<IOAuthAccountRead>(
      `${getURL("OAUTH_ACCOUNTS")}/`,
      payload,
    );
    return res.data;
  };

  return mutate(["usePostOAuthAccount"], postOAuthAccountFn, options);
};
