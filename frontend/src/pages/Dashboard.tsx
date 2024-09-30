import { FunctionComponent, useEffect, useState } from "react";
import ProjectList, { Project } from "../components/ProjectList";
import { Button } from "flowbite-react";
import { AddProjectModal } from "../components/AddProjectModal";
 
const DashBoard: FunctionComponent = () => {

    const [grandTotal, setGrandTotal] = useState(0)
    const [projectData, setProjectData] = useState<null | Array<Project>>(null)
    const [openModal, setOpenModal] = useState(false)

    const fetchProjectData = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/grandtotal/`,{
            credentials : "include"
        })
        .then((res) => (res.json()).then((data) => {
            setGrandTotal(data.total_amount_sum)
        }))
        .catch((e) =>{
            alert("Something went wrong")
            console.error(e)
        })

        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/`,{
            credentials : "include"
        })
        .then((res) => (res.json()).then((data) => {
            data = data.map((project : Project) => ({
                ...project,
                start_date: project.start_date?new Date(project.start_date):null, 
                end_date: project.end_date?new Date(project.end_date):null
              }))
            setProjectData(data)
        }))
        .catch((e) =>{
            alert("Something went wrong")
            console.error(e)
        })
    }

    useEffect(()=>{
        fetchProjectData()
    },[openModal])

    return (
        <div className="flex flex-col w-full h-full">
            <AddProjectModal openModal={openModal} setOpenModal={setOpenModal}/> 
            <div className="grid grid-cols-2 w-full h-36">
                <div className="flex justify-center items-center">
                    <div className="w-64 h-28 bg-sky-300 rounded-lg flex flex-col items-center p-2">
                       <span className="font-bold mb-2">Total Amount:</span>
                       <span className="text-3xl">{grandTotal.toLocaleString('en-IN',{
                            style : "currency",
                            currency : "INR"
                        })}</span>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    <div className="w-64 h-28 bg-sky-300 rounded-lg flex flex-col items-center p-2">
                        <span className="font-bold mb-2">Total Due:</span>
                        <span className="text-3xl">-</span>
                    </div>
                </div>
            </div>
            <div className="flex justify-end w-full h-12 px-3">
                <Button onClick={() => {
                    setOpenModal((prev) => (!prev))
                }} color="blue" outline={false}>Add Project</Button>
            </div>
            <div className="flex grow w-full p-3">
                <div className="w-full h-full">
                    <ProjectList projectData={projectData} />
                </div>
            </div>
        </div>
    );
}
 
export default DashBoard;