import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess, toastWarn } from '../toasts';
import TableCustom from './TableCustom';
import { createColumnHelper } from '@tanstack/react-table';
import { MemberExpense } from '../types';
import SettleMemberModal from './SettleMemberModal';

const MembersView: React.FC = () => {
    const [membersExpenses, setMembersExpenses] = useState<Array<MemberExpense>>([]);
    const [selectedMember, setSelectedMember] = useState<MemberExpense | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchMembersExpenses = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/member-expenses`, {
                credentials: "include"
            });
            const data = await response.json();
            setMembersExpenses(data);
        } catch (error) {
            toastError("Error fetching member expenses");
            console.error('Error fetching member expenses:', error);
        }
    };

    useEffect(() => {
        fetchMembersExpenses();
    }, []);

    const handleSettle = async (settlementType: string, remarks : string) => {
        if (selectedMember) {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/settle/${selectedMember.memberId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ settlementType }),
                    credentials: 'include'
                });
                if (response.ok) {
                    const newTotalDue = selectedMember.totalDue;
                    const updatedMember = { ...selectedMember, totalDue: newTotalDue, totalSettled: selectedMember.totalSettled };

                    setMembersExpenses(prevExpenses =>
                        prevExpenses.map(member =>
                            member.memberId === selectedMember.memberId ? updatedMember : member
                        )
                    );

                    toastSuccess(`Successfully settled member: ${selectedMember.memberName} from ${settlementType}`);
                    setSelectedMember(null); // Clear selection after settling
                    setIsModalOpen(false); // Close modal
                } else {
                    toastError("Error settling the member");
                }
            } catch (error) {
                toastError("Error settling the member");
                console.error('Error settling member:', error);
            }
        }
    };

    const columnHelper = createColumnHelper<MemberExpense>();

    const columns = [
        columnHelper.accessor('memberName', {
            header: 'Member Name',
        }),
        columnHelper.accessor('totalPaid', {
            header: 'Total Paid',
            cell: info => info.getValue().toLocaleString("en-IN", { style: "currency", currency: "INR" }),
        }),
        columnHelper.accessor('totalSettled', {
            header: 'Amount Settled',
            cell: info => info.getValue().toLocaleString("en-IN", { style: "currency", currency: "INR" }),
        }),
        columnHelper.accessor('totalDue', {
            header: 'Amount Due',
            cell: info => info.getValue().toLocaleString("en-IN", { style: "currency", currency: "INR" }),
        }),
    ];

    return (
        <div className="container mx-auto p-4">
            <div className='flex justify-between items-center'>
                <h1 className="text-2xl font-bold mb-4">Members Expenses Overview</h1>
                <div className="flex justify-between mb-4">
                    {selectedMember && (
                        <button
                            onClick={() => {
                                if (selectedMember.totalDue === 0) {
                                    toastWarn("No due to settle!");
                                } else {
                                    setIsModalOpen(true);
                                }
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Settle
                        </button>
                    )}
                </div>
            </div>

            {/* Use the TableCustom component for display */}
            <TableCustom
                data={membersExpenses}
                columns={columns}
                setSelected={(selected) => setSelectedMember(selected[0] || null)}
            />

            {/* Settle Modal */}
            {selectedMember && (
                <SettleMemberModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSettle={handleSettle}
                />
            )}
        </div>
    );
};

export default MembersView;
