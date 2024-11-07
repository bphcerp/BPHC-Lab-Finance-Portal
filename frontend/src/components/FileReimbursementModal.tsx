import React, { useEffect, useState } from 'react';
import { Modal, Button, Select, TextInput } from 'flowbite-react';
import { toastError, toastWarn } from '../toasts';
import { calculateCurrentYear } from '../pages/ProjectDetails';
import { Expense, Project } from '../types';

interface FileReimbursementModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedExpenses: Expense[];
    onFileReimbursement: (expenseIds: string[], projectId: string, projectHead: string, totalAmount: number, title: string, description : string) => Promise<void>;
}

const FileReimbursementModal: React.FC<FileReimbursementModalProps> = ({
    isOpen,
    onClose,
    selectedExpenses,
    onFileReimbursement,
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedProjectHead, setSelectedProjectHead] = useState<string | null>(null);
    const [totalExpenseAmount, setTotalExpenseAmount] = useState<number>(0);
    const [reimbursementTitle, setReimbursementTitle] = useState<string>('');
    const [description, setDescription] = useState<string>("");

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project?all=true`, { credentials: "include" });
                const data: Project[] = await response.json();
                setProjects(data);
            } catch (error) {
                toastError('Error fetching projects');
                console.error('Error fetching projects:', error);
            }
        };

        if (isOpen) {
            const eligibleExpenses = selectedExpenses.filter(expense => !expense.reimbursedID);
            setTotalExpenseAmount(eligibleExpenses.reduce((acc, expense) => acc + expense.amount, 0));

            if (eligibleExpenses.length === 0) {
                toastWarn('No eligible expenses for reimbursement');
                onClose();
            }

            fetchProjects();
        }
    }, [isOpen, selectedExpenses]);

    const handleSubmit = async () => {
        const expenseIds = selectedExpenses.map(expense => expense._id);

        setLoading(true);
        try {
            if (selectedProjectId && selectedProjectHead && reimbursementTitle) {
                await onFileReimbursement(expenseIds, selectedProjectId, selectedProjectHead, totalExpenseAmount, reimbursementTitle, description);
                onClose();
            }
        } catch (error) {
            toastError('Error filing for reimbursement');
            console.error('Error filing for reimbursement:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetModalData = () => {
        setSelectedProjectId(null);
        setSelectedProjectHead(null);
        setTotalExpenseAmount(0);
        setReimbursementTitle('');
    };

    useEffect(() => {
        if (!isOpen) {
            resetModalData();
        }
    }, [isOpen]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>File for Reimbursement</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <TextInput
                        value={reimbursementTitle}
                        onChange={(e) => setReimbursementTitle(e.target.value)}
                        placeholder="Enter reimbursement title"
                        required
                    />
                    <div>
                        <TextInput
                            id="description"
                            placeholder="Enter reimbursement description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                    <Select
                        onChange={(e) => {
                            const value = e.target.value;
                            setSelectedProjectId(value === "" ? null : value);
                            setSelectedProjectHead(null);
                        }}
                        required
                    >
                        <option value="">Select a Project</option>
                        {projects.filter(project => new Date() <= new Date(project.end_date!)).map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.project_name}
                            </option>
                        ))}
                    </Select>
                    {selectedProjectId && (
                        <Select
                            onChange={(e) => {
                                const value = e.target.value;
                                setSelectedProjectHead(value === "" ? null : value);
                            }}
                            required
                        >
                            <option value="">Select a Project Head</option>
                            {Object.entries(projects.find(p => p._id === selectedProjectId)?.project_heads || {}).map(([head , amounts]) => {
                                const currentYearHeadAmount = amounts[calculateCurrentYear(projects.find(p => p._id === selectedProjectId)!)]
                                return (
                                    <option key={head} value={head}>
                                        {head} - {currentYearHeadAmount.toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                        })}
                                    </option>
                                );
                            })}
                        </Select>
                    )}
                    {selectedProjectHead && (
                        <div>
                            {projects.find(p => p._id === selectedProjectId)!.project_heads[selectedProjectHead][calculateCurrentYear(projects.find(p => p._id === selectedProjectId)!)] < totalExpenseAmount ? (
                                <p className="text-red-500">
                                    Selected head cannot cover the total expenses of {totalExpenseAmount.toLocaleString("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    })}.
                                </p>
                            ) : null}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold">Selected Expenses:</h3>
                        {selectedExpenses.map(expense => (
                            !expense.reimbursedID && (
                                <div key={expense._id} className="flex justify-between">
                                    <span>{expense.expenseReason} - {expense.amount.toLocaleString("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    })}
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} disabled={loading} color="failure">
                    Cancel
                </Button>
                <Button color="blue" onClick={handleSubmit} disabled={loading || !selectedProjectId || !selectedProjectHead || !reimbursementTitle || (selectedProjectHead != null && projects.find(p => p._id === selectedProjectId)!.project_heads[selectedProjectHead].reduce((acc, amount) => acc + amount, 0) < totalExpenseAmount)}>
                    {loading ? 'Submitting...' : 'Submit Reimbursement'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FileReimbursementModal;