import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface IRotateTokensResponse {
  success: boolean;
  message: string;
  token_expires_at?: string | null;
  synced_global_variables?: string[];
}

interface IRotateOAuthProvider {
  accountId: string;
}

export const useRotateOAuthProvider: useMutationFunctionType<
  undefined,
  IRotateOAuthProvider
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const rotateOAuthProviderFn = async (
    payload: IRotateOAuthProvider,
  ): Promise<IRotateTokensResponse> => {
    const res = await api.post<IRotateTokensResponse>(
      `${getURL("OAUTH_PROVIDERS")}/${payload.accountId}/rotate`,
    );
    return res.data;
  };

  return mutate(["useRotateOAuthProvider"], rotateOAuthProviderFn, options);
};
