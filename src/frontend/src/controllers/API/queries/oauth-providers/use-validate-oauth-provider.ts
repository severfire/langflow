import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface IValidateConnectionResponse {
  success: boolean;
  message: string;
  details?: Record<string, unknown> | null;
}

interface IValidateOAuthProvider {
  accountId: string;
}

export const useValidateOAuthProvider: useMutationFunctionType<
  undefined,
  IValidateOAuthProvider
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const validateOAuthProviderFn = async (
    payload: IValidateOAuthProvider,
  ): Promise<IValidateConnectionResponse> => {
    const res = await api.post<IValidateConnectionResponse>(
      `${getURL("OAUTH_PROVIDERS")}/${payload.accountId}/validate`,
    );
    return res.data;
  };

  return mutate(["useValidateOAuthProvider"], validateOAuthProviderFn, options);
};
