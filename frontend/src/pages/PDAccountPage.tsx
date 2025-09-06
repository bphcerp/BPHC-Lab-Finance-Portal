import { FunctionComponent, useEffect, useState } from "react";
import { toastError, toastSuccess } from "../toasts";
import { createColumnHelper } from "@tanstack/react-table";
import TableCustom from "../components/TableCustom";
import { Account } from "../types";
import { Button, TextInput } from "flowbite-react";
import AddEntryModal from "../components/AddEntryModal";
import { RiDeleteBin6Line } from "react-icons/ri";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

interface AccountPageProps {
  type: "PDA" | "PDF";
}

const PDAccountPage: FunctionComponent<AccountPageProps> = ({ type }) => {
  const [accountData, setAccountData] = useState<Array<Account>>([]);
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryIdToDelete, setEntryIdToDelete] = useState<string>();

  const columnHelper = createColumnHelper<Account>();

  const columns = [
    columnHelper.accessor("createdAt", {
      header: "Created At",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("en-IN"),
      enableColumnFilter: false,
    }),
    columnHelper.accessor("transactedOn", {
      header: "Transacted On",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("en-IN"),
      enableColumnFilter: false,
    }),
    columnHelper.accessor("remarks", {
      header: "Remarks",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor((row) => (row.credited ? row.amount : 0), {
      header: "Credited",
      cell: (info) =>
        info
          .getValue()
          .toLocaleString("en-IN", { style: "currency", currency: "INR" }),
      enableColumnFilter: false,
      meta: {
        getSum: true,
        sumFormatter: (sum) =>
          sum.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          }),
      },
    }),
    columnHelper.accessor((row) => (!row.credited ? row.amount : 0), {
      header: "Debited",
      cell: (info) =>
        info
          .getValue()
          .toLocaleString("en-IN", { style: "currency", currency: "INR" }),
      enableColumnFilter: false,
      meta: {
        getSum: true,
        sumFormatter: (sum) =>
          sum.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          }),
      },
    }),
    columnHelper.accessor(
      (row) =>
        (row.credited ? row.amount : 0) - (!row.credited ? row.amount : 0),
      {
        header: "Balance",
        cell: (info) =>
          info
            .getValue()
            .toLocaleString("en-IN", { style: "currency", currency: "INR" }),
        enableColumnFilter: false,
        meta: {
          getSum: true,
          sumFormatter: (sum: number) =>
            (
              sum +
              (!openingBalance || isNaN(parseFloat(openingBalance))
                ? 0
                : parseFloat(openingBalance))
            ).toLocaleString("en-IN", { style: "currency", currency: "INR" }),
        },
      }
    ),
    columnHelper.accessor("_id", {
      header: "Actions",
      cell: ({ row }) =>
        row.original.manualEntry ? (
          <button
            className="w-10 flex justify-center hover:cursor-pointer"
            onClick={() => {
              setEntryIdToDelete(row.original._id);
              setIsDeleteModalOpen(true);
            }}
            aria-label="Delete Transfer"
          >
            <RiDeleteBin6Line color="red" />
          </button>
        ) : (
          "NA"
        ),
      enableColumnFilter: false,
    }),
  ];

  const fetchAccountData = async () => {
    if (type) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/account/${type}`,
          { credentials: "include" }
        );
        const data = await response.json();
        setAccountData(data);
      } catch (error) {
        toastError("Error fetching data");
        console.error("Error fetching data:", error);
      }
    }
  };

  const handleAccountEntry = async (formData: any) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/account/entry`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ type, ...formData, manualEntry: true }),
        }
      );

      if (response.ok) {
        toastSuccess(`Entry added!`);
        fetchAccountData();
      } else {
        toastError((await response.json()).message ?? "Something went wrong");
        return;
      }
      console.log("Entry added successfully:");
    } catch (error) {
      toastError("Something went wrong");
      console.error("Error while adding entry:", (error as Error).message);
    } finally {
      setIsAddEntryModalOpen(false);
    }
  };

  useEffect(() => {
    if (type) {
      fetchAccountData();
    }
  }, [type]);

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/account/${entryIdToDelete}`,
        { method: "DELETE", credentials: "include" }
      );
      if (response.ok) toastSuccess("Entry Deleted");
      else throw new Error((await response.json()).message);
    } catch (error) {
      toastError((error as Error).message ?? "Error deleting account entry");
      console.error("Error deleting account entry:", error);
    } finally {
      setIsDeleteModalOpen(false);
      fetchAccountData();
    }
  };

  return (
    <div className="flex flex-col w-full p-4">
      <AddEntryModal
        isOpen={isAddEntryModalOpen}
        onClose={() => setIsAddEntryModalOpen(false)}
        onSubmit={handleAccountEntry}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDelete}
        item={"Account Entry"}
      />
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">{type} Account</h1>
        <div className="flex space-x-2">
          <TextInput
            placeholder="Enter opening balance..."
            value={openingBalance ?? ""}
            onChange={(e) => setOpeningBalance(e.target.value)}
          />
          <Button
            color="blue"
            className="flex justify-center items-center"
            onClick={() => setIsAddEntryModalOpen(true)}
          >
            Add Entry
          </Button>
        </div>
      </div>
      {accountData.length ? (
        <TableCustom
          data={accountData}
          columns={columns}
          initialState={{
            sorting: [
              {
                id: "transactedOn",
                desc: true,
              },
            ],
          }}
        />
      ) : (
        <div>No {type} account data to show</div>
      )}
    </div>
  );
};

export default PDAccountPage;
