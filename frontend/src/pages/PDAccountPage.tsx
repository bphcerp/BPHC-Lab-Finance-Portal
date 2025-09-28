import { FunctionComponent, useEffect, useState } from "react";
import { toastError, toastSuccess } from "../toasts";
import { createColumnHelper } from "@tanstack/react-table";
import TableCustom from "../components/TableCustom";
import { Account } from "../types";
import { Button, TextInput } from "flowbite-react";
import AddEntryModal from "../components/AddEntryModal";
import { useUser } from "../context/UserContext";

interface AccountPageProps {
  type: "PDA" | "PDF";
}

const PDAccountPage: FunctionComponent<AccountPageProps> = ({ type }) => {
  const [accountData, setAccountData] = useState<Array<Account>>([]);
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<string | null>(null);
  const { user } = useUser();
  const columnHelper = createColumnHelper<Account>();

  const columns = [
    columnHelper.accessor("createdAt", {
      header: "Date",
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
  ];

  const fetchAccountData = async () => {
    if (type) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/account/${type}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch account data");
        }
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
        `${import.meta.env.VITE_BACKEND_URL}/api/account/entry`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ type, ...formData }),
        }
      );

      if (response.ok) {
        toastSuccess(`Entry added!`);
        fetchAccountData();
      } else {
        try {
          const errorData = await response.json();
          toastError(errorData.message ?? "Something went wrong");
        } catch (parseError) {
          toastError("Something went wrong");
        }
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

  return (
    <div className="flex flex-col w-full p-4">
      <AddEntryModal
        isOpen={isAddEntryModalOpen}
        onClose={() => setIsAddEntryModalOpen(false)}
        onSubmit={handleAccountEntry}
      />
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">{type} Account</h1>
        {user?.role === "Admin" && (
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
        )}
      </div>
      {accountData.length ? (
        <TableCustom
          data={accountData}
          columns={columns}
          initialState={{
            sorting: [
              {
                id: "createdAt",
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
