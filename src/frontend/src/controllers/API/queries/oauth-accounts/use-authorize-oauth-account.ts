import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface IAuthorizeOAuthAccountResponse {
  authorization_url: string;
  state: string;
}

interface IAuthorizeOAuthAccount {
  accountId: string;
}

export const useAuthorizeOAuthAccount: useMutationFunctionType<
  undefined,
  IAuthorizeOAuthAccount
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const authorizeOAuthAccountFn = async (
    payload: IAuthorizeOAuthAccount,
  ): Promise<IAuthorizeOAuthAccountResponse> => {
    const res = await api.get<IAuthorizeOAuthAccountResponse>(
      `${getURL("OAUTH_ACCOUNTS")}/${payload.accountId}/authorize`,
    );
    return res.data;
  };

  return mutate(["useAuthorizeOAuthAccount"], authorizeOAuthAccountFn, options);
};
