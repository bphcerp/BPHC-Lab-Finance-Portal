import React, { useState } from 'react';

interface SettleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettle: (settlementType: string, amount: number) => void; // onSettle function now includes amount
    maxAmount?: number; // Maximum allowable settlement amount, optional
}

const SettleModal: React.FC<SettleModalProps> = ({ isOpen, onClose, onSettle, maxAmount = 0 }) => {
    const [selectedSettlement, setSelectedSettlement] = useState<string>('Current'); // Default to "Current"
    const [amount, setAmount] = useState<string>(''); // Track amount as string for better control

    if (!isOpen) return null;

    // Function to handle settling with amount and type
    const handleSettle = () => {
        const enteredAmount = Number(amount); // Convert amount to number
        if (enteredAmount > maxAmount) {
            alert(`Amount cannot exceed ${maxAmount.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
            })}`);
            return;
        }
        onSettle(selectedSettlement, enteredAmount); // Pass settlement type and amount to parent
        onClose(); // Close modal after settling
    };

    // Handle amount input change
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value); // Update amount as string
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-80">
                <h2 className="text-lg font-bold mb-4">Settle Expense</h2>

                {/* Settlement Type Selection */}
                <div className="mb-4 flex justify-between">
                    <label>
                        <input
                            type="radio"
                            value="Current"
                            checked={selectedSettlement === 'Current'}
                            onChange={() => setSelectedSettlement('Current')}
                            className="mr-2"
                        />
                        Current
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="Savings"
                            checked={selectedSettlement === 'Savings'}
                            onChange={() => setSelectedSettlement('Savings')}
                            className="mr-2"
                        />
                        Savings
                    </label>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                    <label className="block font-semibold mb-2">Amount to Settle</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        className="w-full px-3 py-2 border rounded"
                        max={maxAmount}
                        placeholder={`Enter amount (max ${maxAmount.toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                        })})`}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={handleSettle}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Settle
                    </button>
                    <button onClick={onClose} className="text-gray-600 hover:underline">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettleModal;
