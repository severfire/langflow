import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface IValidateConnectionResponse {
  success: boolean;
  message: string;
  details?: Record<string, unknown> | null;
}

interface IValidateOAuthAccount {
  accountId: string;
}

export const useValidateOAuthAccount: useMutationFunctionType<
  undefined,
  IValidateOAuthAccount
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const validateOAuthAccountFn = async (
    payload: IValidateOAuthAccount,
  ): Promise<IValidateConnectionResponse> => {
    const res = await api.post<IValidateConnectionResponse>(
      `${getURL("OAUTH_ACCOUNTS")}/${payload.accountId}/validate`,
    );
    return res.data;
  };

  return mutate(["useValidateOAuthAccount"], validateOAuthAccountFn, options);
};
