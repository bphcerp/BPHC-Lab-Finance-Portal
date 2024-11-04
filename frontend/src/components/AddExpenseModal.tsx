import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import AddCategoryModal from './AddCategoryModal';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: Function;
}

export interface Category {
  _id: string;
  name: string;
}

export interface Member {
  _id: string;
  name: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [expenseReason, setExpenseReason] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [amount, setAmount] = useState<number | string>('');
  const [paidBy, setPaidBy] = useState('');
  const [members, setMembers] = useState<Array<Member>>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [description, setDescription] = useState<string>("");

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category/expense`, {
        credentials: 'include',
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toastError('Error fetching categories');
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category/member`, {
        credentials: 'include',
      });
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      toastError('Error fetching members');
      console.error('Error fetching members:', error);
    }
  };

  const handleAddCategory = async (name: string, type: string): Promise<void> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, type }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message);
      }
      if(type === "expense") fetchCategories()
      else if (type === "member" ) fetchMembers()

      toastSuccess('Category added');
    } catch (error) {
      console.error('Error adding category:', error);
      toastError((error as Error).message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchMembers();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (expenseReason && category && amount && paidBy) {
      onSubmit({ expenseReason, category, amount: Number(amount), paidBy, description });
      onClose();
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Add New Expense</Modal.Header>
      <Modal.Body>
        <AddCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={handleAddCategory}
          type='expense'
        />
        <AddCategoryModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          onAddCategory={handleAddCategory}
          type='member'
        />
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
          <div className="flex flex-col">
            <Label htmlFor="category" value="Category" />
            <div className="flex w-full justify-center items-center space-x-4">
              <div className="grow">
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
                <Button color="blue" className="rounded-md" onClick={() => setIsCategoryModalOpen(true)}>Add Category</Button>
              </div>
            </div>
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
            <div className="flex">
              <Select
                id="paidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                required
                className="mt-1 grow"
              >
                <option value="" disabled>Select Member</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </Select>
              <Button color="blue" className="ml-2" onClick={() => setIsMemberModalOpen(true)}>Add Member</Button>
            </div>
          </div>
          <div>
            <Label htmlFor="description" value="Description" />
            <TextInput
              id="description"
              placeholder="Enter expense description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
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
