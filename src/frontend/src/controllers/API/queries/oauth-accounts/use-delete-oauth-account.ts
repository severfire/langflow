import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

interface IDeleteOAuthAccount {
  accountId: string;
}

export const useDeleteOAuthAccount: useMutationFunctionType<
  undefined,
  IDeleteOAuthAccount
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const deleteOAuthAccountFn = async (
    payload: IDeleteOAuthAccount,
  ): Promise<void> => {
    await api.delete(`${getURL("OAUTH_ACCOUNTS")}/${payload.accountId}`);
  };

  return mutate(["useDeleteOAuthAccount"], deleteOAuthAccountFn, options);
};
