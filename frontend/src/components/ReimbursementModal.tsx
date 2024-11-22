import { FunctionComponent } from 'react';
import { Modal, Button } from 'flowbite-react';
import { Reimbursement } from '../types';

interface ReimbursementModalProps {
    isOpen: boolean;
    onClose: () => void;
    label: string
    reimbursements: Reimbursement[];
}

const ReimbursementModal: FunctionComponent<ReimbursementModalProps> = ({ isOpen, onClose, label, reimbursements }) => {
    const totalAmount = reimbursements.reduce((acc, reimbursement) => acc + reimbursement.totalAmount, 0);

    return (
        <Modal size="6xl" show={isOpen} onClose={onClose}>
            <Modal.Header>Reimbursements Under {label}</Modal.Header>
            <Modal.Body>
                <div>
                    {reimbursements.length > 0 ? (
                        <table className="min-w-full bg-white rounded-lg">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Submitted At</th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Title</th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Total Amount</th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Expenses</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reimbursements.map((reimbursement) => (
                                    <tr key={reimbursement._id} className="border-t">
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {new Date(reimbursement.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="py-3 px-6 text-gray-600 text-center">{reimbursement.title}</td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {reimbursement.totalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                        </td>
                                        <td className="py-3 px-6 text-gray-600">
                                            <ul className="list-disc list-inside">
                                                {reimbursement.expenses.map((expense, index) => (
                                                    <li key={index}>{expense.expenseReason} - {expense.amount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</li>
                                                ))}
                                            </ul>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="border-t bg-gray-100 font-semibold">
                                    <td className="py-3 px-6 text-center">Total Expense Amount</td>
                                    <td className="py-3 px-6 text-center"></td>
                                    <td className="py-3 px-6 text-center">
                                        {totalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                    </td>
                                    <td className="py-3 px-6"></td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <p>No reimbursements available for this {label}.</p>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button color="blue" onClick={onClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ReimbursementModal;
