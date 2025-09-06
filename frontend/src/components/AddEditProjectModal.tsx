import {
  Button,
  Label,
  Modal,
  TextInput,
  Radio,
  Textarea,
  Checkbox,
} from "flowbite-react";
import {
  Dispatch,
  FormEventHandler,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { toastError, toastInfo, toastSuccess, toastWarn } from "../toasts";
import { Member, Project } from "../types";
import { FiAlertCircle } from "react-icons/fi";

interface AddProjectProps {
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
  editMode?: boolean;
  editProject?: Project | null;
}

export const AddEditProjectModal: FunctionComponent<AddProjectProps> = ({
  openModal,
  setOpenModal,
  editMode,
  editProject,
}) => {
  const [fundingAgency, setFundingAgency] = useState<string>("");
  const [projectType, setProjectType] = useState<string>("yearly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [projectHeads, setProjectHeads] = useState<{ [key: string]: number[] }>(
    {}
  );
  const [headTotals, setHeadTotals] = useState<{ [key: string]: number }>({});
  const [numberOfYears, setNumberOfYears] = useState<number>(0);
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(0);
  const [newHeadName, setNewHeadName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sanctionLetter, setSanctionLetter] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [faculties, setFaculties] = useState<Array<Member>>([]);
  const [negativeHeads, setNegativeHeads] = useState<Array<string>>([]);
  const [projectID, setProjectID] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [headEditMode, setHeadEditMode] = useState<Record<string, boolean>>({});

  const [pis, setPIs] = useState<string[]>([]);
  const [newPI, setNewPI] = useState<string>("");
  const [coPIs, setCoPIs] = useState<string[]>([]);
  const [newCoPI, setNewCoPI] = useState<string>("");
  const [editRestrict, setEditRestrict] = useState(false);

  const [installmentDates, setInstallmentDates] = useState<
    { start_date: string; end_date: string }[]
  >([]);

  const fetchEditRestrict = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/project/${
          editProject?._id
        }/check-edit-restrict`,
        {
          credentials: "include",
        }
      );
      const editRestrictResponse = (await response.json()).editRestrict;
      setEditRestrict(editRestrictResponse);
      if (editRestrictResponse)
        toastInfo(
          "This project has expenses filed against it. Some fields are disabled or are restricted to ensure data integrity"
        );
    } catch (error) {
      toastError("Something went wrong");
      console.error("Error fetching edit restrict information", error);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/member?type=faculty`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      setFaculties(data);
    } catch (error) {
      toastError("Error fetching members");
      console.error("Error fetching members:", error);
    }
  };

  const calculateNumberOfYears = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startYear =
        start.getMonth() < 3 ? start.getFullYear() - 1 : start.getFullYear();
      const endYear =
        end.getMonth() < 3 ? end.getFullYear() - 1 : end.getFullYear();
      const yearsDiff = endYear - startYear + 1;
      const yearsNum = yearsDiff >= 1 ? yearsDiff : 0;
      setNumberOfYears(yearsNum);
      resizeProjectHeads(yearsNum);
    }
  };

  useEffect(() => {
    if (projectType === "yearly") calculateNumberOfYears()
  }, [startDate, endDate]);

  // Populate form when in edit mode
  useEffect(() => {
    if (openModal && editMode && editProject) {
      setFundingAgency(editProject.funding_agency);
      setProjectID(editProject.project_id);
      setProjectTitle(editProject.project_title);
      setStartDate(
        new Date(editProject.start_date).toISOString().split("T")[0]
      );
      setEndDate(new Date(editProject.end_date).toISOString().split("T")[0]);
      setPIs(editProject.pis.map((pi) => pi._id));
      setCoPIs(editProject.copis.map((copi) => copi._id));
      setProjectType(editProject.project_type);
      setProjectHeads(editProject.project_heads);
      setDescription(editProject.description || "");
      setSanctionLetter(editProject.sanction_letter_url || null);
      setNegativeHeads(editProject.negative_heads || []);

      const totals: { [key: string]: number } = {};
      Object.keys(editProject.project_heads).forEach((head) => {
        totals[head] = editProject.project_heads[head].reduce(
          (sum, val) => sum + val,
          0
        );
      });
      setHeadTotals(totals);

      if (editProject.project_type === "invoice" && editProject.installments) {
        setNumberOfInstallments(editProject.installments.length);
        const formattedInstallments = editProject.installments.map((inst) => ({
          start_date: new Date(inst.start_date).toISOString().split("T")[0],
          end_date: new Date(inst.end_date).toISOString().split("T")[0],
        }));
        setInstallmentDates(formattedInstallments);
      }
    }
  }, [openModal, editMode, editProject]);

  const resizeArray = <T,>(arr: T[], num: number, filler: T): T[] =>
    arr.length > num
      ? arr.slice(0, num)
      : [...arr, ...Array(num - arr.length).fill(filler)];

  const resizeProjectHeads = (num: number) => {
    const updatedProjectHeads = Object.fromEntries(
      Object.entries(projectHeads).map(([key, arr]) => [
        key,
        resizeArray(arr, num, 0),
      ])
    );

    setProjectHeads(updatedProjectHeads);
    const newHeadTotals = Object.fromEntries(
      Object.entries(updatedProjectHeads).map(([headName, arr]) => [
        headName,
        arr.reduce((acc, val) => acc + val, 0),
      ])
    );

    setHeadTotals(newHeadTotals);
  };

  const handleInstallmentsChange = (num: number) => {
    if (editMode && editRestrict && num < editProject!.installments!.length)
      return;
    setNumberOfInstallments(num);

    resizeProjectHeads(num);

    if (num > 0 && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalMs = end.getTime() - start.getTime();
      const stepMs = Math.floor(totalMs / num);
      const newInstallments = [];
      for (let i = 0; i < num; i++) {
        const instStart = new Date(start.getTime() + i * stepMs);
        let instEnd;
        if (i === num - 1) {
          instEnd = end;
        } else {
          instEnd = new Date(start.getTime() + (i + 1) * stepMs - 86400000);
        }
        newInstallments.push({
          start_date: instStart.toISOString().split("T")[0],
          end_date: instEnd.toISOString().split("T")[0],
        });
      }
      setInstallmentDates(newInstallments);
    } else {
      setInstallmentDates([]);
    }
  };

  const addProjectHead = () => {
    if (
      !newHeadName ||
      (projectType === "yearly" && numberOfYears <= 0) ||
      (projectType === "invoice" && numberOfInstallments <= 0)
    ) {
      return;
    }
    const count =
      projectType === "yearly" ? numberOfYears : numberOfInstallments;
    setProjectHeads((prevHeads) => ({
      ...prevHeads,
      [newHeadName.trim()]: Array(count).fill(0),
    }));
    setHeadEditMode((prev) => ({ ...prev, [newHeadName.trim()]: true }));
    setNewHeadName("");
  };

  const handleProjectHeadYearChange = (
    headName: string,
    index: number,
    value: number
  ) => {
    setProjectHeads((prevHeads) => ({
      ...prevHeads,
      [headName]: prevHeads[headName].map((val, idx) =>
        idx === index ? value : val
      ),
    }));
  };

  const saveProjectHead = (headName: string) => {
    const headTotal = projectHeads[headName].reduce((acc, val) => acc + val, 0);
    setHeadTotals((prevTotals) => ({ ...prevTotals, [headName]: headTotal }));
    setHeadEditMode((prevEditMode) => ({ ...prevEditMode, [headName]: false }));
  };

  const deleteProjectHead = (headName: string) => {
    const updatedHeads = { ...projectHeads };
    const updatedHeadTotals = { ...headTotals };
    delete updatedHeads[headName];
    delete updatedHeadTotals[headName];
    setProjectHeads(updatedHeads);
    setHeadTotals(updatedHeadTotals);
  };

  const addPI = () => {
    if (newPI && !pis.includes(newPI)) {
      setPIs((prevPIs) => [...prevPIs, newPI]);
      setNewPI("");
    }
  };

  const deletePI = (index: number) => {
    setPIs((prevPIs) => prevPIs.filter((_, i) => i !== index));
  };

  const addCoPI = () => {
    if (newCoPI && !coPIs.includes(newCoPI)) {
      setCoPIs((prevCoPIs) => [...prevCoPIs, newCoPI]);
      setNewCoPI("");
    }
  };

  const deleteCoPI = (index: number) => {
    setCoPIs((prevCoPIs) => prevCoPIs.filter((_, i) => i !== index));
  };

  const handleProjectTypeChange = (type: "invoice" | "yearly") => {
    if (Object.keys(projectHeads).length)
      toastWarn(
        "Project type changed. Please verify the project head amounts once again"
      );
    setProjectType(type);
    const numberOfIndices =
      type === "invoice" ? numberOfInstallments : numberOfYears;
    resizeProjectHeads(numberOfIndices);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setLoading(true);

    const totalAmount = Object.values(headTotals).reduce(
      (sum, value) => sum + value,
      0
    );

    const payload: Omit<
      Project,
      "pis" | "copis" | "carry_forward" | "override" | "note"
    > & {
      pis: string[];
      copis: string[];
    } = {
      funding_agency: fundingAgency,
      project_id: projectID,
      project_title: projectTitle,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      total_amount: totalAmount,
      project_type: projectType,
      pis,
      copis: coPIs,
      project_heads: projectHeads,
      negative_heads: negativeHeads,
      description,
      sanction_letter_url: sanctionLetter,
    };

    if (projectType === "invoice" && numberOfInstallments > 0) {
      payload.installments = installmentDates.map((d) => ({
        start_date: new Date(d.start_date).toISOString(),
        end_date: new Date(d.end_date).toISOString(),
      }));
    }

    const numberOfIndices =
      payload.project_type === "invoice" ? numberOfInstallments : numberOfYears;
    console.log(numberOfIndices, payload.project_heads);

    try {
      if (
        !Object.values(payload.project_heads).every(
          (arr) => arr.length === numberOfIndices
        )
      ) {
        throw Error(
          `Invalid data provided. The project heads data doesnt match with number of ${
            payload.project_type === "invoice" ? "installments" : "years"
          }`
        );
      }

      const response =
        editMode && editProject
          ? await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/project/${editProject._id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
              }
            )
          : await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            });

      if (response.ok) {
        toastSuccess(
          `Project ${editMode ? "updated successfully" : "added successfully"}`
        );
        setOpenModal(false);
      } else {
        toastError(
          (await response.json()).message ??
            `Error ${editMode ? "updating" : "adding"} project`
        );
      }
    } catch (e) {
      toastError((e as Error).message ?? "An unexpected error occurred");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Reset form state when modal is closed
  useEffect(() => {
    if (!openModal) {
      setFundingAgency("");
      setProjectID("");
      setProjectTitle("");
      setStartDate("");
      setEndDate("");
      setProjectHeads({});
      setHeadTotals({});
      setNumberOfYears(0);
      setNumberOfInstallments(0);
      setPIs([]);
      setNewPI("");
      setCoPIs([]);
      setNewCoPI("");
      setSanctionLetter(null);
      setInstallmentDates([]);
      setDescription("");
      setNegativeHeads([]);
      setNewHeadName("");
      setHeadEditMode({});
    } else {
      fetchFaculties();
      if (editProject) fetchEditRestrict();
    }
  }, [openModal]);

  return (
    <div>
      <Modal
        show={openModal}
        size="7xl"
        popup
        onClose={() => setOpenModal(false)}
      >
        <Modal.Header className="p-5">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            {editMode ? "Edit Project" : "Add New Project"}
          </h3>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-x-4">
              <div>
                <Label htmlFor="projectID" value="Project ID" />
                <TextInput
                  id="projectID"
                  type="text"
                  placeholder="Enter Project ID"
                  required
                  value={projectID}
                  onChange={(e) => setProjectID(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="funding_agency" value="Funding Agency" />
                <TextInput
                  id="funding_agency"
                  placeholder="Enter Funding Agency"
                  value={fundingAgency}
                  onChange={(e) => setFundingAgency(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="project_title" value="Project Title" />
                <TextInput
                  id="project_title"
                  type="text"
                  placeholder="Enter Project Title (optional)"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>
            </div>

            {/* PIs and Co-PIs */}
            <div className="flex justify-between gap-x-8">
              <div className="space-y-2 flex-1">
                <Label htmlFor="pi" value="Add Principal Investigators (PIs)" />
                <div className="flex items-center space-x-3">
                  <select
                    id="pi"
                    value={newPI}
                    onChange={(e) => setNewPI(e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select PI</option>
                    {faculties.map((faculty) => (
                      <option value={faculty._id} key={faculty._id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                  <Button color="blue" onClick={addPI} disabled={!newPI}>
                    Add
                  </Button>
                </div>
                {pis.length > 0 && (
                  <div className="mt-4 border rounded p-2">
                    <h4 className="font-bold mb-2">Selected PIs:</h4>
                    <ul className="space-y-1">
                      {pis.map((pi, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>
                            {faculties.find((faculty) => faculty._id === pi)
                              ?.name || "Unknown Faculty"}
                          </span>
                          <Button
                            color="failure"
                            onClick={() => deletePI(idx)}
                            type="button"
                            size="xs"
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <Label value="Add Co-Principal Investigators (Co-PIs)" />
                <div className="flex items-center space-x-3">
                  <select
                    value={newCoPI}
                    onChange={(e) => setNewCoPI(e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select Co-PI</option>
                    {faculties.map((faculty) => (
                      <option value={faculty._id} key={faculty._id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                  <Button color="blue" onClick={addCoPI} disabled={!newCoPI}>
                    Add
                  </Button>
                </div>
                {coPIs.length > 0 && (
                  <div className="mt-4 border rounded p-2">
                    <h4 className="font-bold mb-2">Selected Co-PIs:</h4>
                    <ul className="space-y-1">
                      {coPIs.map((coPI, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>
                            {faculties.find((faculty) => faculty._id === coPI)
                              ?.name || "Unknown Faculty"}
                          </span>
                          <Button
                            color="failure"
                            onClick={() => deleteCoPI(idx)}
                            type="button"
                            size="xs"
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {editMode && editRestrict && (
              <div className="flex space-x-2 text-yellow-500">
                <FiAlertCircle />
                <span>The project type cannot be changed</span>
              </div>
            )}

            <div>
              <Label value="Project Type" />
              <div className="flex space-x-4">
                <Radio
                  id="yearly"
                  disabled={editMode && editRestrict}
                  name="projectType"
                  value="yearly"
                  checked={projectType === "yearly"}
                  onChange={() => handleProjectTypeChange("yearly")}
                />
                <Label htmlFor="yearly" value="Yearly" />
                <Radio
                  id="invoice"
                  disabled={editMode && editRestrict}
                  name="projectType"
                  value="invoice"
                  checked={projectType === "invoice"}
                  onChange={() => handleProjectTypeChange("invoice")}
                />
                <Label htmlFor="invoice" value="Invoice" />
              </div>
            </div>

            {editMode && editRestrict && (
              <div className="flex space-x-2 text-yellow-500">
                <FiAlertCircle />
                <span>
                  The start date and end date cannot be set to an interval
                  lesser than what was set before
                </span>
              </div>
            )}

            <div className="flex space-x-3">
              <div className="w-1/2">
                <Label htmlFor="start_date" value="Start Date" />
                <TextInput
                  id="start_date"
                  type="date"
                  value={startDate}
                  {...(editMode && editRestrict
                    ? {
                        max: new Date(editProject!.start_date)
                          .toISOString()
                          .split("T")[0],
                      }
                    : {})}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setNumberOfInstallments(0);
                    setInstallmentDates([]);
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
                  {...(editMode && editRestrict
                    ? {
                        min: new Date(editProject!.end_date)
                          .toISOString()
                          .split("T")[0],
                      }
                    : {})}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setNumberOfInstallments(0);
                    setInstallmentDates([]);
                  }}
                  required
                />
              </div>
            </div>

            {projectType === "invoice" ? (
              <>
                {editMode && editRestrict && (
                  <div className="flex space-x-2 text-yellow-500">
                    <FiAlertCircle />
                    <span>
                      Number of installments cannot be decreased lesser than the
                      original number
                    </span>
                  </div>
                )}
                <div>
                  <Label
                    htmlFor="installments"
                    value="Number of Installments"
                  />
                  <TextInput
                    id="installments"
                    type="number"
                    min={
                      editMode && editRestrict
                        ? editProject?.installments?.length
                        : 0
                    }
                    value={numberOfInstallments}
                    onChange={(e) =>
                      handleInstallmentsChange(Number(e.target.value))
                    }
                    required
                  />
                  {numberOfInstallments > 0 && (
                    <div className="grid grid-cols-2 gap-y-6 mt-3">
                      {Array.from({ length: numberOfInstallments }).map(
                        (_, index) => (
                          <div key={index} className="flex space-x-2">
                            <div>
                              <Label
                                htmlFor={`installment_start_${index}`}
                                value={`Installment ${index + 1} Start`}
                              />
                              <TextInput
                                id={`installment_start_${index}`}
                                type="date"
                                min={
                                  index
                                    ? installmentDates[index - 1]?.end_date ??
                                      startDate ??
                                      ""
                                    : startDate ?? ""
                                }
                                value={
                                  installmentDates[index]?.start_date || ""
                                }
                                onChange={(e) => {
                                  const updatedDates = [...installmentDates];
                                  updatedDates[index] = {
                                    ...updatedDates[index],
                                    start_date: e.target.value,
                                  };
                                  setInstallmentDates(updatedDates);
                                }}
                                required
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`installment_end_${index}`}
                                value={`Installment ${index + 1} End`}
                              />
                              <TextInput
                                id={`installment_end_${index}`}
                                type="date"
                                value={installmentDates[index]?.end_date || ""}
                                min={
                                  installmentDates[index]?.start_date ??
                                  startDate ??
                                  ""
                                }
                                max={
                                  index === numberOfInstallments - 1
                                    ? endDate ?? ""
                                    : ""
                                }
                                onChange={(e) => {
                                  const updatedDates = [...installmentDates];
                                  updatedDates[index] = {
                                    ...updatedDates[index],
                                    end_date: e.target.value,
                                  };
                                  setInstallmentDates(updatedDates);
                                }}
                                required
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="years" value="Number of Years" />
                <TextInput
                  id="years"
                  type="number"
                  value={numberOfYears}
                  readOnly
                />
              </div>
            )}

            {/* Project Heads section */}
            <div className="border-t pt-4">
              <Label htmlFor="head_name" value="Project Head" />
              <div className="flex items-center space-x-3">
                <TextInput
                  id="head_name"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  placeholder="Enter head name"
                  className="flex-grow"
                />
                <Button color="blue" onClick={addProjectHead}>
                  Add Head
                </Button>
              </div>
              {editMode && editRestrict && (
                <div className="flex items-center my-2 space-x-2 text-yellow-500">
                  <FiAlertCircle />
                  <span>Project heads cannot be deleted</span>
                </div>
              )}
              {Object.keys(projectHeads).map((head) => (
                <div key={head} className="mt-4 space-y-2 border rounded p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold">{head}</h4>
                      <Checkbox
                        id={`${head}_neg_checkbox`}
                        checked={negativeHeads.includes(head)}
                        onChange={() => {
                          if (negativeHeads.includes(head)) {
                            setNegativeHeads(
                              negativeHeads.filter(
                                (negativeHead) => negativeHead !== head
                              )
                            );
                          } else {
                            setNegativeHeads([...negativeHeads, head]);
                          }
                        }}
                      />
                      <Label
                        value="Allow Negative"
                        htmlFor={`${head}_neg_checkbox`}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      {headEditMode[head] ? (
                        <Button
                          color="green"
                          size="xs"
                          onClick={() => saveProjectHead(head)}
                        >
                          Save
                        </Button>
                      ) : (
                        <Button
                          color="yellow"
                          size="xs"
                          onClick={() => {
                            setHeadEditMode((prev) => ({
                              ...prev,
                              [head]: true,
                            }));
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        color="red"
                        size="xs"
                        onClick={() => deleteProjectHead(head)}
                        disabled={editMode && editRestrict}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 items-end">
                    {projectHeads[head].map((value, idx) =>
                      headEditMode[head] ? (
                        <div key={idx} className="mt-2 space-y-1">
                          <Label
                            htmlFor={`${head}_${idx}`}
                            value={`${
                              projectType === "invoice" ? "Inst." : "Year"
                            } ${idx + 1}`}
                          />
                          <TextInput
                            id={`${head}_${idx}`}
                            type="number"
                            value={value}
                            onChange={(e) =>
                              handleProjectHeadYearChange(
                                head,
                                idx,
                                Number(e.target.value)
                              )
                            }
                            required
                          />
                        </div>
                      ) : (
                        <div
                          key={idx}
                          className="flex flex-col text-center p-1"
                        >
                          <span className="font-semibold text-sm">{`${
                            projectType === "invoice" ? "Inst." : "Year"
                          } ${idx + 1}`}</span>
                          <span className="text-gray-700">{value}</span>
                        </div>
                      )
                    )}
                    <div className="flex flex-col text-center p-1 ml-2 border-l pl-3">
                      <span className="font-bold text-sm">Total</span>
                      <span className="text-gray-900 font-semibold">
                        {headTotals[head] || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div>
                <Label htmlFor="total_amount" value="Total Sanctioned Amount" />
                <TextInput
                  id="total_amount"
                  type="number"
                  readOnly
                  value={
                    Object.values(headTotals).reduce(
                      (sum, value) => sum + value,
                      0
                    ) ?? ""
                  }
                />
              </div>
              <div>
                <Label htmlFor="description" value="Project Description" />
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <Label htmlFor="sanction_letter" value="Sanction Letter Link" />
                <TextInput
                  id="sanction_letter"
                  value={sanctionLetter ?? ""}
                  onChange={(e) => setSanctionLetter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <Button
                color="gray"
                onClick={() => setOpenModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button color="blue" type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : editMode
                  ? "Update Project"
                  : "Save Project"}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};
