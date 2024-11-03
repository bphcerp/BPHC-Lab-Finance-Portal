// src/components/SettleModal.tsx
import React, { useState } from 'react';

interface SettleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettle: (settlementType: string) => void;
}

const SettleModal: React.FC<SettleModalProps> = ({ isOpen, onClose, onSettle }) => {
    const [selectedSettlement, setSelectedSettlement] = useState<string>('Current'); // Default selection

    if (!isOpen) return null;

    const handleSettle = () => {
        onSettle(selectedSettlement);
        onClose(); // Close the modal after settling
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-80">
                <h2 className="text-lg font-bold mb-4">Settle Expense</h2>
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
