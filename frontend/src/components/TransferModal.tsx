import { Modal, TextInput, Button, Label } from "flowbite-react";
import { SubmitHandler, useForm } from "react-hook-form";

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: SubmitHandler<any>;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { register, handleSubmit, reset } = useForm<any>();

    const handleFormSubmit: SubmitHandler<any> = (formData) => {
        onSubmit(formData);
        reset();
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Transfer Amount</Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="transfer-amount">Amount</Label>
                        <TextInput
                            id="transfer-amount"
                            type="number"
                            {...register("amount", { valueAsNumber: true })}
                            required
                            placeholder="Enter transfer amount"
                        />
                    </div>

                    <Button type="submit" color="blue">Transfer</Button>
                </form>
            </Modal.Body>
        </Modal>
    );
};

export default TransferModal;
