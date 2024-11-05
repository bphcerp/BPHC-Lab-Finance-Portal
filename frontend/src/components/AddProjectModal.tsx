import { Button, Label, Modal, TextInput, FileInput } from "flowbite-react";
import { Dispatch, FormEventHandler, FunctionComponent, SetStateAction, useEffect, useState } from "react";
import { toastError, toastSuccess } from "../toasts";

interface AddProjectProps {
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
}

export const AddProjectModal: FunctionComponent<AddProjectProps> = ({ openModal, setOpenModal }) => {
  const [projectName, setProjectName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [projectHeads, setProjectHeads] = useState<{ [key: string]: number[] }>({});
  const [headTotals, setHeadTotals] = useState<{ [key: string]: number }>({});
  const [numberOfYears, setNumberOfYears] = useState<number>(0);
  const [newHeadName, setNewHeadName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sanctionLetter, setSanctionLetter] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number | null>(null); // Allow user input for total amount

  // New states for PIs and Co-PIs
  const [pis, setPIs] = useState<string[]>([]);
  const [newPI, setNewPI] = useState<string>("");
  const [coPIs, setCoPIs] = useState<string[]>([]);
  const [newCoPI, setNewCoPI] = useState<string>("");

  const calculateNumberOfYears = () => {
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const yearsDiff = (end - start) / (1000 * 60 * 60 * 24 * 365);
      setNumberOfYears(yearsDiff >= 1 ? Math.floor(yearsDiff) : 0);
    }
  };

  useEffect(calculateNumberOfYears, [startDate, endDate]);

  const addProjectHead = () => {
    if (!newHeadName || numberOfYears <= 0) return;
    setProjectHeads((prevHeads) => ({
      ...prevHeads,
      [newHeadName]: Array(numberOfYears).fill(0),
    }));
    setNewHeadName("");
  };

  const handleProjectHeadYearChange = (headName: string, yearIndex: number, value: number) => {
    setProjectHeads((prevHeads) => ({
      ...prevHeads,
      [headName]: prevHeads[headName].map((val, idx) => (idx === yearIndex ? value : val)),
    }));
  };

  const saveProjectHead = (headName: string) => {
    const headTotal = projectHeads[headName].reduce((acc, val) => acc + val, 0);
    setHeadTotals((prevTotals) => ({ ...prevTotals, [headName]: headTotal }));
  };

  const editProjectHead = (headName: string) => {
    const updatedHeadTotals = { ...headTotals };
    delete updatedHeadTotals[headName];
    setHeadTotals(updatedHeadTotals);
  };

  const deleteProjectHead = (headName: string) => {
    const updatedHeads = { ...projectHeads };
    const updatedHeadTotals = { ...headTotals };
    delete updatedHeads[headName];
    delete updatedHeadTotals[headName];
    setProjectHeads(updatedHeads);
    setHeadTotals(updatedHeadTotals);
  };

  // Functions for managing PIs and Co-PIs
  const addPI = () => {
    if (newPI) {
      setPIs((prevPIs) => [...prevPIs, newPI]);
      setNewPI("");
    }
  };

  const deletePI = (index: number) => {
    setPIs((prevPIs) => prevPIs.filter((_, i) => i !== index));
  };

  const addCoPI = () => {
    if (newCoPI) {
      setCoPIs((prevCoPIs) => [...prevCoPIs, newCoPI]);
      setNewCoPI("");
    }
  };

  const deleteCoPI = (index: number) => {
    setCoPIs((prevCoPIs) => prevCoPIs.filter((_, i) => i !== index));
  };

  const handleAddProject: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Create FormData to handle both the project data and the file
    const formData = new FormData();
    formData.append("project_name", projectName);
    formData.append("start_date", startDate ? new Date(startDate).toISOString() : "");
    formData.append("end_date", endDate ? new Date(endDate).toISOString() : "");
    formData.append("total_amount", totalAmount!.toString());
    formData.append("pis", JSON.stringify(pis));
    formData.append("copis", JSON.stringify(coPIs));
    formData.append("project_heads", JSON.stringify(projectHeads));
    formData.append("description", description);

    // Append sanction letter file if present
    if (sanctionLetter) {
      formData.append("sanction_letter", sanctionLetter);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/`, {
        method: "POST",
        body: formData, // FormData is used here, so no need for 'Content-Type: application/json'
        credentials: "include",
      });

      if (res.ok) {
        toastSuccess("Project added");
        setOpenModal(false);
      } else {
        toastError("Error adding project");
      }
    } catch (e) {
      toastError("Error");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!openModal) {
      setProjectName("");
      setStartDate("");
      setEndDate("");
      setProjectHeads({});
      setHeadTotals({});
      setNumberOfYears(0);
      setTotalAmount(null); // Reset total amount when closing modal
      setPIs([]);
      setCoPIs([]);
      setSanctionLetter(null);
      setLoading(false)
      setDescription("")
    }
  }, [openModal]);

  return (
    <div>
      <Modal show={openModal} size="4xl" popup onClose={() => setOpenModal(false)}>
        <Modal.Header className="p-5">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">Add New Project</h3>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAddProject} className="space-y-4">
            <div>
              <Label htmlFor="project_name" value="Project Name" />
              <TextInput
                id="project_name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            <div className="flex space-x-3">
              <div className="w-1/2">
                <Label htmlFor="start_date" value="Start Date" />
                <TextInput
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="w-1/2">
                <Label htmlFor="end_date" value="End Date" />
                <TextInput
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="years" value="Number of Years" />
                <TextInput id="years" type="number" value={numberOfYears} readOnly />
              </div>
            </div>

            {/* Project Heads Section */}
            <div>
              <Label htmlFor="project_head" value="Project Heads" />
              <div className="flex space-x-2">
                <TextInput
                  id="project_head"
                  placeholder="Enter Project Head Name"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                />
                <Button color="blue" size="sm" onClick={addProjectHead}>
                  Add Project Head
                </Button>
              </div>
              {Object.keys(projectHeads).map((headName, index) => (
                <div key={index} className="mt-2">
                  <span>{headName}</span>
                  <div className="flex space-x-2">
                    {projectHeads[headName].map((yearValue, yearIndex) => (
                      <TextInput
                        key={yearIndex}
                        type="number"
                        value={yearValue}
                        onChange={(e) =>
                          handleProjectHeadYearChange(headName, yearIndex, Number(e.target.value))
                        }
                      />
                    ))}
                    <Button color="green" size="xs" onClick={() => saveProjectHead(headName)}>
                      Save
                    </Button>
                    <Button color="yellow" size="xs" onClick={() => editProjectHead(headName)}>
                      Edit
                    </Button>
                    <Button color="red" size="xs" onClick={() => deleteProjectHead(headName)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              {/* PIs Section */}
              <div>
                <Label htmlFor="pi" value="PIs" />
                <div className="flex space-x-2">
                  <TextInput
                    id="pi"
                    placeholder="Enter PI Name"
                    value={newPI}
                    onChange={(e) => setNewPI(e.target.value)}
                  />
                  <Button color="blue" size="sm" onClick={addPI}>
                    Add PI
                  </Button>
                </div>
                {pis.map((pi, index) => (
                  <div key={index} className="mt-2 flex justify-between items-center">
                    <span>{pi}</span>
                    <Button color="red" size="xs" onClick={() => deletePI(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {/* Co-PIs Section */}
              <div>
                <Label htmlFor="co_pi" value="Co-PIs" />
                <div className="flex space-x-2">
                  <TextInput
                    id="co_pi"
                    placeholder="Enter Co-PI Name"
                    value={newCoPI}
                    onChange={(e) => setNewCoPI(e.target.value)}
                  />
                  <Button color="blue" size="sm" onClick={addCoPI}>
                    Add Co-PI
                  </Button>
                </div>
                {coPIs.map((coPI, index) => (
                  <div key={index} className="mt-2 flex justify-between items-center">
                    <span>{coPI}</span>
                    <Button color="red" size="xs" onClick={() => deleteCoPI(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="description" value="Description" />
              <TextInput
                id="description"
                placeholder="Enter project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="total_amount" value="Total Amount" />
              <TextInput
                id="total_amount"
                type="number"
                value={totalAmount ?? ""} // Use nullish coalescing to avoid uncontrolled input warning
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <Label htmlFor="sanction_letter" value="Upload Sanction Letter" />
              <FileInput
                id="sanction_letter"
                onChange={(e) => setSanctionLetter(e.target.files ? e.target.files[0] : null)}
                accept="application/pdf"
              />
            </div>

            <Button color="blue" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Project"}
            </Button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};