import { FunctionComponent } from 'react';
import { Modal, Button } from 'flowbite-react';
import { Expense } from '../types';

interface ProjectHeadExpensesProps {
    isOpen: boolean;
    onClose: () => void;
    label: string
    expenses: Expense[];
}

const ProjectHeadExpenses: FunctionComponent<ProjectHeadExpensesProps> = ({ isOpen, onClose, label, expenses }) => {
    const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);

    return (
        <Modal size="6xl" show={isOpen} onClose={onClose}>
            <Modal.Header>Expenses Under {label}</Modal.Header>
            <Modal.Body>
                <div>
                    {expenses.length > 0 ? (
                        <table className="min-w-full bg-white rounded-lg">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Created At</th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Updated At</th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Reason</th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense._id} className="border-t">
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {new Date(expense.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {new Date(expense.updatedAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="py-3 px-6 text-gray-600 text-center">{expense.expenseReason}</td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {expense.amount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="border-t bg-gray-100 font-semibold">
                                    <td className="py-3 px-6 text-center">Total Expense Amount</td>
                                    <td className="py-3 px-6 text-center"></td>
                                    <td className="py-3 px-6"></td>
                                    <td className="py-3 px-6 text-center">
                                        {totalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <p>No expenses available for {label}.</p>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button color="blue" onClick={onClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProjectHeadExpenses;
