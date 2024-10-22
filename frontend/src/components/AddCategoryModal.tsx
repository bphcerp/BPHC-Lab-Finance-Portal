import React, { useEffect, useState } from 'react';
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCategory: (name: string, type: string) => Promise<void>;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onAddCategory }) => {
    const [name, setName] = useState<string>('');
    const [type, setType] = useState<string>('expense');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!name.trim() || !type) return;
        setLoading(true);
        try {
            await onAddCategory(name, type);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setName('')
        setLoading(false)
    },[isOpen])

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Add New Category</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name" value="Category Name" />
                        <TextInput
                            id="name"
                            type="text"
                            placeholder="Enter category name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="type" value="Category Type" />
                        <Select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                        >
                            <option value="expense">Expense</option>
                        </Select>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} disabled={loading} color="failure">
                    Cancel
                </Button>
                <Button color="blue" onClick={handleSubmit} isProcessing={loading} disabled={loading || !name}>
                    {loading ? 'Adding...' : 'Add Category'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddCategoryModal;