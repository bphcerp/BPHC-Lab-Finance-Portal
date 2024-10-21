import { Button, Label, Modal, TextInput } from "flowbite-react";
import { Dispatch, FormEvent, FormEventHandler, FunctionComponent, SetStateAction, useEffect, useState } from "react";
import { Project } from "./ProjectList";
import { toastError, toastSuccess } from "../toasts";

interface AddProjectProps {
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
}

export const AddProjectModal: FunctionComponent<AddProjectProps> = ({ openModal, setOpenModal }) => {
  const [projectName, setProjectName] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [projectHeads, setProjectHeads] = useState<{ [key: string]: number[] }>({})
  const [headTotals, setHeadTotals] = useState<{ [key: string]: number }>({})
  const [numberOfYears, setNumberOfYears] = useState<number>(0)
  const [newHeadName, setNewHeadName] = useState<string>("")
  const [totalAmount, setTotalAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const calculateNumberOfYears = () => {    
    if (startDate && endDate) {
      
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const yearsDiff = (end - start)/(1000*60*60*24*365);
      setNumberOfYears(yearsDiff >= 1 ? Math.floor(yearsDiff) : 0);
    }
  };

  useEffect(calculateNumberOfYears,[startDate,endDate])

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

  const calculateGrandTotal = () => {
    return Object.values(headTotals).reduce((acc, val) => acc + val, 0);
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

  const handleAddProject : FormEventHandler<HTMLFormElement> = (e :  FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const newProject: Project = {
        project_name: projectName,
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        project_heads: projectHeads,
        total_amount: totalAmount!,
    }

    fetch(`${import.meta.env.VITE_BACKEND_URL}/project/`,{
        method : "POST",
        headers :{
            "content-type" : "application/json"
        },
        body : JSON.stringify(newProject),
        credentials : "include"
    })
    .then((res) => {
        if (res.ok){
            toastSuccess("Project added")
            setOpenModal(false)
        }
        else toastError("Error adding project")
    })
    .catch((e) =>{
        toastError("Error")
        console.error(e)
    })
    .finally(() => {
        setLoading(false)
    })

  }

  useEffect(() => {
    if (!openModal) {
      setProjectName("");
      setStartDate("");
      setEndDate("");
      setProjectHeads({});
      setHeadTotals({});
      setNumberOfYears(0);
      setTotalAmount(null)
    }
  }, [openModal]);

  return (
    <div>
      <Modal show={openModal} size="lg" popup onClose={() => setOpenModal(false)}>
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
                    onChange={(e) => {
                    setStartDate(e.target.value);
                    }}
                    required
                />
              </div>

              <div className="w-1/2">
                <Label htmlFor="end_date" value="End Date" />
                <TextInput
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                    setEndDate(e.target.value);
                    }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="years" value="Number of Years" />
              <TextInput
                id="years"
                type="number"
                value={numberOfYears}
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="new_head" value="New Project Head" />
              <div className="flex space-x-2">
                <TextInput
                  id="new_head"
                  placeholder="Enter project head name"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                />
                <Button color="blue" size="sm" onClick={addProjectHead}>Add Head</Button>
              </div>

              {Object.keys(projectHeads).map((headName) => (
                <div key={headName} className="mt-4">
                  <h4 className="font-medium">{headName}</h4>
                  {!headTotals[headName] ? (
                    <div className="space-y-2">
                      {projectHeads[headName].map((value, yearIndex) => (
                        <div key={yearIndex} className="flex items-center space-x-2">
                          <Label htmlFor={`${headName}_year_${yearIndex}`} value={`Year ${yearIndex + 1}`} />
                          <TextInput
                            id={`${headName}_year_${yearIndex}`}
                            type="number"
                            value={value}
                            onChange={(e) => handleProjectHeadYearChange(headName, yearIndex, Number(e.target.value))}
                          />
                        </div>
                      ))}
                      <Button size="xs"  color="blue" onClick={() => saveProjectHead(headName)}>Save Head</Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex space-x-4">
                        {projectHeads[headName].map((value, yearIndex) => (
                          <div key={yearIndex}>
                            <span>Year {yearIndex + 1}: {value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="font-medium">Total: {headTotals[headName]}</div>
                      <div className="flex space-x-2">
                        <Button size="xs"  color="blue" onClick={() => editProjectHead(headName)}>Edit Head</Button>
                        <Button size="xs"  color="failure" onClick={() => deleteProjectHead(headName)}>Delete Head</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 font-medium">
              Project Head Total: {calculateGrandTotal()}
            </div>

            <div>
              <Label htmlFor="total_amount" value="Total Amount" />
              <TextInput
                id="total_amount"
                type="number"
                placeholder="Enter total amount"
                value={totalAmount!}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="w-full">
              <Button isProcessing={loading} color="blue" type="submit">Save Project</Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};
