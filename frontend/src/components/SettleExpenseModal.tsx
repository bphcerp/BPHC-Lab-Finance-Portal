import { Button, Modal, Label, Radio } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastWarn } from '../toasts';
import { Expense } from '../pages/Expenses';

interface SettleExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedExpenses: Expense[];
    onSettle: (ids: string[], settledStatus: 'Current' | 'Savings') => void;
}

const SettleExpenseModal: React.FC<SettleExpenseModalProps> = ({
    isOpen,
    onClose,
    selectedExpenses,
    onSettle,
}) => {
    const [settledStatus, setSettledStatus] = useState<'Current' | 'Savings' | null>(null);

    const handleSettle = () => {
        if (settledStatus) {
            const ids = selectedExpenses.map(expense => expense._id);
            onSettle(ids, settledStatus);
            onClose();
        } else {
            toastError('Please select a settled status');
        }
    };

    useEffect(() => {
        if (isOpen) {
            const eligibleExpenses = selectedExpenses.filter(expense => !expense.settled);
            if (eligibleExpenses.length === 0) {
                toastWarn("No eligible expenses for settling");
                onClose();
            }
        }
    }, [isOpen, selectedExpenses, onClose]);

    const resetModalData = () => {
        setSettledStatus(null);
    };

    useEffect(() => {
        if (!isOpen) {
            resetModalData();
        }
    }, [isOpen]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Settle Expense</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Selected Expenses</h3>
                    <ul>
                        {selectedExpenses.map(expense => (
                            <li key={expense._id} className="mb-2">
                                {expense.expenseReason} - {expense.amount.toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                        })} - {expense.paidBy.name}
                            </li>
                        ))}
                    </ul>
                    <div>
                        <Label>Settled Status</Label>
                        <div className="mt-2 space-y-2">
                            <Radio
                                id="Current"
                                name="settled"
                                value="Current"
                                checked={settledStatus === 'Current'}
                                onChange={() => setSettledStatus('Current')}
                            />
                            <Label htmlFor="Current">Current</Label>
                            <Radio
                                id="Savings"
                                name="settled"
                                value="Savings"
                                checked={settledStatus === 'Savings'}
                                onChange={() => setSettledStatus('Savings')}
                            />
                            <Label htmlFor="Savings">Savings</Label>
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button color="failure" onClick={onClose}>
                    Cancel
                </Button>
                <Button color="blue" disabled={settledStatus == null} onClick={handleSettle}>
                    Settle Expense
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SettleExpenseModal;
