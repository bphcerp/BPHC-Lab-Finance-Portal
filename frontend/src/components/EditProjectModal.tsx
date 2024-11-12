import { Button, Modal, Label, TextInput, Checkbox } from 'flowbite-react';
import { useForm } from 'react-hook-form';
import { Project } from "../types";
import { useEffect } from 'react';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    onSave: (updatedProject: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project, onSave }) => {
    const { register, handleSubmit, watch, setValue, reset } = useForm<Project>();

    useEffect(() => {
        if (project) {
            reset(project);
        }
    }, [project, reset]);

    const onSubmit = (updatedProject: Project) => {
        onSave(updatedProject);
        onClose();
    };

    return (
        <Modal show={isOpen} onClose={onClose} size="4xl">
            <Modal.Header>
                <h2 className="text-lg font-semibold">Edit Project</h2>
            </Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="projectName" value="Project Name" />
                            <TextInput
                                id="projectName"
                                {...register("project_name", { required: true })}
                                placeholder="Enter project name"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="totalAmount" value="Total Amount" />
                            <TextInput
                                id="totalAmount"
                                type="number"
                                {...register("total_amount", { required: true, valueAsNumber: true })}
                                placeholder="Enter total amount"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <h3 className="text-md font-medium text-gray-700">Project Heads</h3>
                        {project?.project_heads && Object.entries(project.project_heads).map(([headName, amounts], index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Label value={headName} className="text-sm font-semibold text-gray-600" />
                                    <Checkbox
                                        id={`${headName}_neg_checkbox`}
                                        checked={watch('negative_heads') ? watch('negative_heads').includes(headName) : false}
                                        onChange={() => {
                                            if (watch('negative_heads').includes(headName)) setValue('negative_heads',watch('negative_heads').filter(negativeHead => negativeHead != headName))
                                            else setValue('negative_heads',[...watch('negative_heads'), headName])
                                        }}
                                    />
                                    <Label
                                        value="Allow Negative Values"
                                        htmlFor={`${headName}_neg_checkbox`}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {amounts.map((amount, i) => (
                                        <TextInput
                                            key={i}
                                            type="number"
                                            defaultValue={amount}
                                            {...register(`project_heads.${headName}.${i}`, { valueAsNumber: true })}
                                            placeholder={`Installment ${i + 1}`}
                                            className="mt-1"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <h3 className="text-md font-medium text-gray-700">Principal Investigators (PIs)</h3>
                        {(project?.pis || []).map((pi, index) => (
                            <TextInput
                                key={index}
                                defaultValue={pi}
                                {...register(`pis.${index}`)}
                                placeholder={`PI ${index + 1}`}
                                className="mt-1"
                            />
                        ))}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <h3 className="text-md font-medium text-gray-700">Co-Principal Investigators (CoPIs)</h3>
                        {(project?.copis || []).map((copi, index) => (
                            <TextInput
                                key={index}
                                defaultValue={copi}
                                {...register(`copis.${index}`)}
                                placeholder={`CoPI ${index + 1}`}
                                className="mt-1"
                            />
                        ))}
                    </div>
                </form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} color="gray">
                    Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit(onSubmit)} className="bg-blue-600 hover:bg-blue-700">
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditProjectModal;
