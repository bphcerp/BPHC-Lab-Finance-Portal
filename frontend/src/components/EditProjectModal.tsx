import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import { FunctionComponent, useEffect, useState } from "react";
import { Project } from "../types";

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    onSave: (updatedProject: Project) => void;
}

const EditProjectModal: FunctionComponent<EditProjectModalProps> = ({ isOpen, onClose, project, onSave }) => {
    const [projectName, setProjectName] = useState('');
    const [projectType, setProjectType] = useState('');
    const [totalAmount, setTotalAmount] = useState<number | string>('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    useEffect(() => {
        if (project) {
            setProjectName(project.project_name);
            setProjectType(project.project_type);
            setTotalAmount(project.total_amount);
            setStartDate(project.start_date ? new Date(project.start_date) : null);
            setEndDate(project.end_date ? new Date(project.end_date) : null);
        }
    }, [project]);

    const handleSave = async () => {
        if (project) {
            try {
                const updatedProject = {
                    ...project,
                    project_name: projectName,
                    project_type: projectType,
                    total_amount: Number(totalAmount),
                    start_date: startDate,
                    end_date: endDate,
                };

                const response = await fetch(`/api/projects/${project._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedProject)
                });

                if (!response.ok) {
                    throw new Error('Failed to update project');
                }

                const updatedData = await response.json();
                onSave(updatedData);
                onClose();
            } catch (error) {
                console.error('Error updating project:', error);
            }
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Edit Project</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="projectName" value="Project Name" />
                        <TextInput
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="projectType" value="Project Type" />
                        <Select
                            id="projectType"
                            value={projectType}
                            onChange={(e) => setProjectType(e.target.value)}
                        >
                            <option value="yearly">Yearly</option>
                            <option value="invoice">Invoice</option>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="totalAmount" value="Total Amount" />
                        <TextInput
                            id="totalAmount"
                            type="number"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="startDate" value="Start Date" />
                        <TextInput
                            id="startDate"
                            type="date"
                            value={startDate ? startDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                        />
                    </div>
                    <div>
                        <Label htmlFor="endDate" value="End Date" />
                        <TextInput
                            id="endDate"
                            type="date"
                            value={endDate ? endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} color="gray">
                    Cancel
                </Button>
                <Button onClick={handleSave}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditProjectModal;