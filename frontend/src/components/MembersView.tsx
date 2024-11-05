import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess, toastWarn } from '../toasts';
import SettleMemberModal from './SettleMemberModal'; // Import the modal component

interface MemberExpense {
    memberId: string;
    memberName: string;
    totalPaid: number;
    totalSettled: number;
    totalDue: number;
}

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

    const handleSelectMember = (member: MemberExpense) => {
        setSelectedMember(selectedMember === member ? null : member); // Toggle selection
    };

    const handleSettle = async (settlementType: string) => {
        if (selectedMember) {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/settle/${selectedMember.memberId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ settlementType }), // Send the settlement type
                    credentials: 'include'
                });
                if (response.ok) {
                    toastSuccess(`Successfully settled member : ${selectedMember.memberName} from ${settlementType}`);
                    fetchMembersExpenses(); // Refresh the expenses after settling
                    setSelectedMember(null); // Clear selection after settling
                } else {
                    toastError("Error settling the member");
                }
            } catch (error) {
                toastError("Error settling the member");
                console.error('Error settling member:', error);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className='flex justify-between items-center'>
                <h1 className="text-2xl font-bold mb-4">Members Expenses Overview</h1>
                <div className="flex justify-between mb-4">
                    {selectedMember && (
                        <button
                            onClick={() => {
                                if (selectedMember.totalDue === 0){
                                    toastWarn("No due to settle!")  
                                }
                                else setIsModalOpen(true)
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Settle
                        </button>
                    )}
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Settled</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {membersExpenses.map(member => (
                            <tr key={member.memberId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="radio"
                                        name="memberSelect"
                                        checked={selectedMember === member}
                                        onChange={() => handleSelectMember(member)}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{member.memberName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{member.totalPaid.toLocaleString("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                })}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{member.totalSettled.toLocaleString("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                })}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{member.totalDue.toLocaleString("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                })}</td>
                            </tr>
                        ))}
                        {membersExpenses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center">No member expenses found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Settle Modal */}
            <SettleMemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSettle={handleSettle}
            />
        </div>
    );
};

export default MembersView;
