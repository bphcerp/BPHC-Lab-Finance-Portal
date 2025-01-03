import { createColumnHelper } from "@tanstack/react-table";
import { FunctionComponent, useEffect, useState } from "react";
import { InstituteExpense } from "../types";
import TableCustom from "../components/TableCustom";
import { toastError } from "../toasts";
import React from "react";
import { Link } from "react-router-dom";

export const InstituteExpensesPage: FunctionComponent = () => {

    const [expenses, setExpenses] = useState<Array<InstituteExpense>>([]);
    const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());

    const columnHelper = createColumnHelper<InstituteExpense>()

    const columns = [
        columnHelper.accessor('createdAt', {
            header: 'Created At',
            cell: (info) =>
                info.getValue()
                    ? new Date(info.getValue()).toLocaleDateString('en-IN')
                    : 'N/A',
            enableColumnFilter:false
        }),
        columnHelper.accessor('updatedAt', {
            header: 'Updated At',
            cell: (info) =>
                info.getValue()
                    ? new Date(info.getValue()).toLocaleDateString('en-IN')
                    : 'N/A',
            enableColumnFilter:false
        }),
        columnHelper.accessor('expenseReason', {
            header: 'Expense Reason',
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('category.name', {
            header: 'Category',
            cell: (info) => info.getValue(),
            meta : {
                filterType : 'dropdown'
            }
        }),
        columnHelper.accessor('project.project_name', {
            header: 'Project Name',
            cell: info => <Link className='hover:underline text-blue-600'
                to={`/project/${info.row.original.project._id}`}
                target="_blank"
                rel="noopener noreferrer">
                {info.row.original.project.project_name}-{info.row.original.project.project_title}
            </Link>
        }),
        columnHelper.accessor('projectHead', {
            header: 'Project Head',
            cell: (info) => info.getValue(),
            meta : {
                filterType : 'dropdown'
            }
        }),
        columnHelper.accessor('amount', {
            header: 'Amount',
            cell: (info) =>
                info.getValue().toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                }),
            enableColumnFilter:false
        }),
        columnHelper.accessor('paidBy.name', {
            header: 'Paid By',
            cell: (info) => info.getValue(),
            meta : {
                filterType : 'dropdown'
            }
        }),
        columnHelper.accessor('overheadPercentage', {
            header: 'Overhead %',
            cell: (info) => `${info.getValue() * 100}%`,
            enableColumnFilter:false
        }),
    ]

    const fetchExpenses = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense?type=Institute`, { credentials: "include" });
            const data = await response.json();
            setExpenses(data);
        } catch (error) {
            toastError("Error fetching expenses");
            console.error('Error fetching expenses:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    return (
        <div className="flex flex-col">
            <span className="text-2xl font-bold mb-4">Institute Expenses</span>
            <TableCustom data={expenses} columns={columns} setSelected={(selectedExpenses: Array<InstituteExpense>) => {
                setSelectedExpenses(new Set(selectedExpenses.map(expense => expense._id)))
            }} initialState={{
                sorting: [
                    {
                        id: 'updatedAt',
                        desc: true
                    }
                ]
            }} />
        </div>
    )
}