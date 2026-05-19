import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

interface IDeleteOAuthProvider {
  accountId: string;
}

export const useDeleteOAuthProvider: useMutationFunctionType<
  undefined,
  IDeleteOAuthProvider
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const deleteOAuthProviderFn = async (
    payload: IDeleteOAuthProvider,
  ): Promise<void> => {
    await api.delete(`${getURL("OAUTH_PROVIDERS")}/${payload.accountId}`);
  };

  return mutate(["useDeleteOAuthProvider"], deleteOAuthProviderFn, options);
};
