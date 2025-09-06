import {
  Modal,
  TextInput,
  Button,
  Label,
  Radio,
  Datepicker,
} from "flowbite-react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toastError } from "../toasts";

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<any>;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { register, handleSubmit, reset, control } = useForm<any>({
    defaultValues: {
        amount: 0,
        transactedOn: new Date(),
    }
  });

  const handleFormSubmit: SubmitHandler<any> = (formData) => {
    if (!formData.credited){
        toastError("Please select a transaction type");
        return;
    }
    onSubmit(formData);
    reset();
  };

  return (
    <Modal size="3xl" show={isOpen} onClose={onClose}>
      <Modal.Header>Add New Entry</Modal.Header>
      <Modal.Body className="overflow-visible">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entry-amount">Amount</Label>
              <TextInput
                id="entry-amount"
                type="number"
                min={1}
                {...register("amount", { valueAsNumber: true, required: true })}
                required
                placeholder="Amount"
              />
            </div>

            <Controller
              name="transactedOn"
              control={control}
              rules={{ required: "The transaction date is required" }}
              render={({ field, fieldState }) => (
                <div>
                  <Label htmlFor="transaction-date">Transaction Date</Label>
                  <Datepicker
                    id="transaction-date"
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Select the date of the transaction"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <div>
            <Label>Transaction Type</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <Radio {...register("credited")} value="true" />
                <span>Credited</span>
              </label>
              <label className="flex items-center space-x-2">
                <Radio {...register("credited")} value="false" />
                <span>Debited</span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="entry-remarks">Remarks</Label>
            <TextInput
              id="entry-remarks"
              {...register("remarks")}
              placeholder="Additional remarks"
            />
          </div>

          <Button type="submit" color="blue">
            Save
          </Button>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default AddEntryModal;
