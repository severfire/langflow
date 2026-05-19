import type { RowClickedEvent, SelectionChangedEvent } from "ag-grid-community";
import { useCallback, useState } from "react";
import TableComponent from "@/components/core/parameterRenderComponent/components/tableComponent";
import {
  type IOAuthProviderRead,
  useDeleteOAuthProvider,
  useGetOAuthProvidersQuery,
} from "@/controllers/API/queries/oauth-providers";
import useAlertStore from "@/stores/alertStore";
import AddOAuthProviderModal from "./components/AddOAuthProviderModal";
import OAuthProviderHeader from "./components/OAuthProviderHeader";
import { getColumnDefs } from "./helpers/column-defs";

export default function OAuthProvidersPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<IOAuthProviderRead | null>(null);

  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const setErrorData = useAlertStore((state) => state.setErrorData);

  const { data, refetch } = useGetOAuthProvidersQuery();
  const accounts: IOAuthProviderRead[] = data?.accounts ?? [];

  const { mutate: deleteAccount } = useDeleteOAuthProvider();

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
                    ? "OAuth provider deleted"
                    : "OAuth providers deleted",
              });
            }
          },
          onError: (err: unknown) => {
            setErrorData({
              title: "Failed to delete OAuth provider",
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
      <OAuthProviderHeader
        selectedRows={selectedRows}
        onAdd={() => setShowAddModal(true)}
        onDelete={handleDelete}
      />

      <div className="flex h-full w-full flex-col justify-between">
        <TableComponent
          key="oauthProviders"
          onDelete={handleDelete}
          overlayNoRowsTemplate="No OAuth providers configured yet"
          onSelectionChanged={(event: SelectionChangedEvent) => {
            setSelectedRows(
              event.api
                .getSelectedRows()
                .map((row: IOAuthProviderRead) => row.id),
            );
          }}
          onRowClicked={(event: RowClickedEvent<IOAuthProviderRead>) => {
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
        <AddOAuthProviderModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {editingAccount && (
        <AddOAuthProviderModal
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
