import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError } from '../toasts';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: Function;
}

export interface Category {
  _id: string;
  name: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [expenseReason, setExpenseReason] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [amount, setAmount] = useState<number | string>('');
  const [paidBy, setPaidBy] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category/expense`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toastError("Error fetching categories");
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (expenseReason && category && amount && paidBy) {
      onSubmit({ expenseReason, category, amount: Number(amount), paidBy });
      onClose();
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Add New Expense</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <Label htmlFor="expenseReason" value="Expense Reason" />
            <TextInput
              id="expenseReason"
              value={expenseReason}
              onChange={(e) => setExpenseReason(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="category" value="Category" />
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="mt-1"
            >
              <option value="" disabled>Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="amount" value="Amount" />
            <TextInput
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="paidBy" value="Paid By" />
            <TextInput
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
        <Button color="blue" onClick={handleSubmit}>
          Add Expense
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddExpenseModal;
