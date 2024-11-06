import { ColumnDef } from "@tanstack/react-table";
import { Button } from "flowbite-react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import TableCustom from "../components/TableCustom";

type Inputs = {
    selectedConfig: string
}

const AdminPage: React.FC = () => {

    function generateColumns<T extends object>(data: T): ColumnDef<T, any>[] {
        return [...Object.keys(data).filter(key => key != "_id" && key != "type").map((key) => ({
            id: key,
            accessorKey: key as keyof T,
            header: key.replace(/_/g, ' '), //removes the underscore
            enableColumnFilter: key.includes("name"),
            meta: {
                filterType: "dropdown"
            }
        }))
        ];
    }

    const [columns, setColumns] = useState<ColumnDef<any, any>[] | null>(null)
    const [data, setData] = useState([])

    const { register, handleSubmit, watch } = useForm<Inputs>();
    const onSubmit: SubmitHandler<Inputs> = async ({ selectedConfig }) => {
        const fetchPath = selectedConfig === "Category" ? "/category" : selectedConfig === "Student" ? "/member?type=student" : "member/?type=faculty"

        const res = await (await fetch(`${import.meta.env.VITE_BACKEND_URL}${fetchPath}`, {
            credentials: "include",
        })).json();

        setData(res)

        setColumns(generateColumns(res[0]))

    }
    return (
        <div className="flex flex-col w-full p-4 space-y-4">
            <span className="text-2xl font-bold">Admin Configuration</span>
            <div className="flex justify-between">
                <form className="flex space-x-2" onSubmit={handleSubmit(onSubmit)}>
                    <select defaultValue="" {...register("selectedConfig")} required>
                        <option value="" disabled>Select Configuration</option>
                        <option>Category</option>
                        <option>Student</option>
                        <option>Faculty</option>
                    </select>

                    <Button type="submit" color="blue">Get</Button>

                </form>
                {watch("selectedConfig")?<Button color="blue">Add {watch("selectedConfig")}</Button> :<></>}
            </div>
            <div className="container mx-auto grow flex flex-col items-center shadow-md bg-gray-100 rounded-md">
                {columns ? <TableCustom data={data} columns={columns} /> : <span className="text-2xl">No Config Selected.</span>}
            </div>
        </div>
    );
}

export default AdminPage;