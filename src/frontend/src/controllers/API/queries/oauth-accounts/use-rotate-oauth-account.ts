import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface IRotateTokensResponse {
  success: boolean;
  message: string;
  token_expires_at?: string | null;
}

interface IRotateOAuthAccount {
  accountId: string;
}

export const useRotateOAuthAccount: useMutationFunctionType<
  undefined,
  IRotateOAuthAccount
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const rotateOAuthAccountFn = async (
    payload: IRotateOAuthAccount,
  ): Promise<IRotateTokensResponse> => {
    const res = await api.post<IRotateTokensResponse>(
      `${getURL("OAUTH_ACCOUNTS")}/${payload.accountId}/rotate`,
    );
    return res.data;
  };

  return mutate(["useRotateOAuthAccount"], rotateOAuthAccountFn, options);
};
