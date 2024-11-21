import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import { createColumnHelper } from '@tanstack/react-table';
import TableCustom from '../components/TableCustom';
import { Account } from '../types';
import { Button } from 'flowbite-react';
import TransferModal from '../components/TransferModal';
import { RiDeleteBin6Line } from 'react-icons/ri';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

interface AccountPageProps {
    type: 'Current' | 'Savings';
}

const AccountPage: FunctionComponent<AccountPageProps> = ({ type }) => {
    const [accountData, setAccountData] = useState<Array<Account>>([]);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<Account>();
    const [columns, setColumns] = useState<any[]>([]);

    const columnHelper = createColumnHelper<Account>();

    // Define base columns
    const baseColumns = useMemo(
        () => [
            columnHelper.accessor('createdAt', {
                header: 'Date',
                cell: (info) => new Date(info.getValue()).toLocaleDateString('en-IN'),
                enableColumnFilter: false,
            }),
            columnHelper.accessor('remarks', {
                header: 'Remarks',
                cell: (info) => info.getValue() ?? '-',
            }),
            columnHelper.accessor((row) => (row.credited ? row.amount : 0), {
                header: 'Credited',
                cell: (info) =>
                    info.getValue().toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                    }),
                enableColumnFilter: false,
                meta: {
                    getSum: true,
                    sumFormatter: (sum: number) =>
                        sum.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                },
            }),
            columnHelper.accessor((row) => (!row.credited ? row.amount : 0), {
                header: 'Debited',
                cell: (info) =>
                    info.getValue().toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                    }),
                enableColumnFilter: false,
                meta: {
                    getSum: true,
                    sumFormatter: (sum: number) =>
                        sum.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                },
            }),
            columnHelper.accessor(
                (row) => (row.credited ? row.amount : 0) - (!row.credited ? row.amount : 0),
                {
                    header: 'Balance',
                    cell: (info) =>
                        info
                            .getValue()
                            .toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                    enableColumnFilter: false,
                    meta: {
                        getSum: true,
                        sumFormatter: (sum: number) =>
                            sum.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                    },
                }
            ),
        ],
        []
    );

    // Define additional columns for "Current" accounts
    const currentColumns = useMemo(
        () => [
            columnHelper.accessor((row) => (row.transferable ? 'Yes' : 'No'), {
                header: 'Transferable',
                cell: (info) =>
                    (info.row.original.transferable || 0).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                    }),
                enableColumnFilter: false,
                meta: {
                    filterType : "dropdown",
                    getSum: true,
                    sumFormatter: (sum: number) =>
                        <span className={sum<0?"text-green-400":"text-red-600"}>{sum.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>,
                },
            }),
            columnHelper.accessor('_id', {
                header: 'Actions',
                cell: ({ row }) =>
                    row.original.transferable < 0 ? (
                        <button
                            className="w-10 flex justify-center hover:cursor-pointer"
                            onClick={() => {
                                setEntryToDelete(row.original);
                                setIsDeleteModalOpen(true);
                            }}
                            aria-label="Delete Transfer"
                        >
                            <RiDeleteBin6Line color="red" />
                        </button>
                    ) : (
                        'NA'
                    ),
                enableColumnFilter: false,
            }),
        ],
        []
    );

    // Fetch account data
    const fetchAccountData = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/account/${type}`,
                { credentials: 'include' }
            );
            const data = await response.json();
            setAccountData(data);
        } catch (error) {
            toastError('Error fetching data');
            console.error('Error fetching data:', error);
        }
    };

    // Delete transfer
    const handleTransferDelete = async () => {
        try {
            await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/account/${entryToDelete?._id}`,
                { method: 'DELETE', credentials: 'include' }
            );
            toastSuccess('Transfer Deleted');
            fetchAccountData();
        } catch (error) {
            toastError('Error deleting transfer');
            console.error('Error deleting transfer:', error);
        }
    };

    // Handle a new transfer
    const handleTransfer = async (formData: any) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/account/transfer`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(formData),
                }
            );

            if (response.ok) {
                toastSuccess('Transfer successful!');
                fetchAccountData();
            } else {
                const { message } = await response.json();
                toastError(message ?? 'Something went wrong');
            }
        } catch (error) {
            toastError('Error processing transfer');
            console.error('Error processing transfer:', error);
        } finally {
            setIsTransferModalOpen(false);
        }
    };

    // Update columns when the account type changes
    useEffect(() => {
        fetchAccountData().then(
        () => setColumns(type === 'Current' ? [...baseColumns, ...currentColumns] : baseColumns)
        )
    }, [type, baseColumns, currentColumns]);

    return (
        <div className="flex flex-col w-full p-4">
            {/* Modals */}
            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onSubmit={handleTransfer}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleTransferDelete}
                item={entryToDelete?.remarks ?? 'Transfer'}
            />

            {/* Header and Button */}
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">{type} Account</h1>
                {type === 'Current' && (
                    <Button
                        color="blue"
                        className="flex justify-center items-center"
                        onClick={() => setIsTransferModalOpen(true)}
                    >
                        Transfer
                    </Button>
                )}
            </div>

            {/* Loading or Table */}
            {accountData.length ? (
                <TableCustom
                    data={accountData}
                    columns={columns}
                    initialState={{
                        sorting: [
                            {
                                id: 'createdAt',
                                desc: true,
                            },
                        ],
                    }}
                />
            ) : (
                <div>Loading data...</div>
            )}
        </div>
    );
};

export default AccountPage;
