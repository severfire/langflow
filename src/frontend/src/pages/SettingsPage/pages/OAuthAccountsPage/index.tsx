import type { RowClickedEvent, SelectionChangedEvent } from "ag-grid-community";
import { useCallback, useState } from "react";
import TableComponent from "@/components/core/parameterRenderComponent/components/tableComponent";
import {
  type IOAuthAccountRead,
  useDeleteOAuthAccount,
  useGetOAuthAccountsQuery,
} from "@/controllers/API/queries/oauth-accounts";
import useAlertStore from "@/stores/alertStore";
import AddOAuthAccountModal from "./components/AddOAuthAccountModal";
import OAuthAccountHeader from "./components/OAuthAccountHeader";
import { getColumnDefs } from "./helpers/column-defs";

export default function OAuthAccountsPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<IOAuthAccountRead | null>(null);

  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const setErrorData = useAlertStore((state) => state.setErrorData);

  const { data, refetch } = useGetOAuthAccountsQuery();
  const accounts: IOAuthAccountRead[] = data?.accounts ?? [];

  const { mutate: deleteAccount } = useDeleteOAuthAccount();

  const handleDelete = useCallback(() => {
    selectedRows.forEach((id) => {
      deleteAccount(
        { accountId: id },
        {
          onSuccess: () => {
            refetch();
            if (selectedRows.indexOf(id) === selectedRows.length - 1) {
              setSuccessData({
                title:
                  selectedRows.length === 1
                    ? "OAuth account deleted"
                    : "OAuth accounts deleted",
              });
            }
          },
          onError: (err: unknown) => {
            setErrorData({
              title: "Failed to delete OAuth account",
              list: [
                (
                  err as {
                    response?: { data?: { detail?: string } };
                    message?: string;
                  }
                )?.response?.data?.detail ?? (err as Error)?.message,
              ],
            });
          },
        },
      );
    });
  }, [selectedRows, deleteAccount, refetch, setSuccessData, setErrorData]);

  const columnDefs = getColumnDefs();

  return (
    <div className="flex h-full w-full flex-col justify-between gap-6">
      <OAuthAccountHeader
        selectedRows={selectedRows}
        onAdd={() => setShowAddModal(true)}
        onDelete={handleDelete}
      />

      <div className="flex h-full w-full flex-col justify-between">
        <TableComponent
          key="oauthAccounts"
          onDelete={handleDelete}
          overlayNoRowsTemplate="No OAuth accounts configured yet"
          onSelectionChanged={(event: SelectionChangedEvent) => {
            setSelectedRows(
              event.api
                .getSelectedRows()
                .map((row: IOAuthAccountRead) => row.id),
            );
          }}
          onRowClicked={(event: RowClickedEvent<IOAuthAccountRead>) => {
            if (event.data) setEditingAccount(event.data);
          }}
          rowSelection="multiple"
          suppressRowClickSelection
          pagination
          columnDefs={columnDefs}
          rowData={accounts}
        />
      </div>

      {showAddModal && (
        <AddOAuthAccountModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {editingAccount && (
        <AddOAuthAccountModal
          open={editingAccount !== null}
          onClose={() => setEditingAccount(null)}
          onSuccess={() => {
            refetch();
          }}
          mode="edit"
          initialData={editingAccount}
        />
      )}
    </div>
  );
}
