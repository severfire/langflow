import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface IAuthorizeOAuthProviderResponse {
  authorization_url: string;
  state: string;
}

interface IAuthorizeOAuthProvider {
  accountId: string;
}

export const useAuthorizeOAuthProvider: useMutationFunctionType<
  undefined,
  IAuthorizeOAuthProvider
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const authorizeOAuthProviderFn = async (
    payload: IAuthorizeOAuthProvider,
  ): Promise<IAuthorizeOAuthProviderResponse> => {
    const res = await api.get<IAuthorizeOAuthProviderResponse>(
      `${getURL("OAUTH_PROVIDERS")}/${payload.accountId}/authorize`,
    );
    return res.data;
  };

  return mutate(
    ["useAuthorizeOAuthProvider"],
    authorizeOAuthProviderFn,
    options,
  );
};
