import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel, flexRender, Column, getFacetedRowModel, getFacetedUniqueValues, InitialTableState } from "@tanstack/react-table";
import { Checkbox, TextInput, Table } from "flowbite-react";
import { FunctionComponent, useEffect, useMemo } from "react";

interface TableCustomProps {
    data: Array<any>
    columns: Array<any>
    setSelected? : (selected : Array<any>) => void
    initialState? : InitialTableState
}

const TableCustom: FunctionComponent<TableCustomProps> = ({ data, columns, setSelected, initialState }) => {

    const getSortedUniqueValues = (column: Column<any, unknown>) => {
        return useMemo(
            () =>
                Array.from(column.getFacetedUniqueValues().keys())
                    .sort()
                    .slice(0, 5000),
            [column.getFacetedUniqueValues()]
        )
    }


    const table = useReactTable({
        data,
        columns,
        initialState,
        enableMultiRowSelection : true,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(), // client-side faceting
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    useEffect(() => {
        if (setSelected) setSelected(Object.keys(table.getState().rowSelection).map(row => table.getRow(row).original))
    },[table.getState().rowSelection])

    return (
        <>
            <div className="flex flex-col w-full bg-white shadow-md rounded-lg">
                <Table>
                    {table.getHeaderGroups().map(headerGroup => (
                        <Table.Head className="bg-gray-200" key={headerGroup.id}>
                            <Table.HeadCell className="bg-inherit px-4 py-2.5">
                                {table.getHeaderGroups().length > 1 && !headerGroup.depth ? null : <Checkbox
                                    {...{
                                        checked: table.getIsAllRowsSelected(),
                                        onChange: table.getToggleAllRowsSelectedHandler(),
                                    }}
                                />}
                            </Table.HeadCell>
                            {headerGroup.headers.map(header => (
                                <Table.HeadCell className={`bg-inherit px-0 py-2.5 ${table.getHeaderGroups().length > 1 && !headerGroup.depth ? 'text-center' : ""}`} key={header.id} colSpan={header.colSpan}>
                                    {header.isPlaceholder ? null : (
                                        <>
                                            <div
                                                {...{
                                                    className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                                                    onClick: header.column.getToggleSortingHandler(),
                                                }}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: ' 🔼',
                                                    desc: ' 🔽',
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                            {header.column.getCanFilter() ? <div className="mt-2">
                                                {header.column.columnDef.meta && (header.column.columnDef.meta as any).filterType === "dropdown" ?
                                                    <select
                                                        onChange={e => header.column.setFilterValue(e.target.value)}
                                                        value={(header.column.getFilterValue() ?? "") as string}
                                                    >
                                                        <option value="">All</option>
                                                        {getSortedUniqueValues(header.column).map(value => (
                                                            <option value={value} key={value}>{value}</option>
                                                        ))}
                                                    </select>
                                                    :
                                                    <TextInput
                                                        className="w-36"
                                                        color="blue"
                                                        onChange={e => header.column.setFilterValue(e.target.value)}
                                                        placeholder="Search..."
                                                        type="text"
                                                        value={(header.column.getFilterValue() ?? '') as string}
                                                    />}
                                            </div> : null}
                                        </>
                                    )}
                                </Table.HeadCell>
                            ))}
                        </Table.Head>
                    ))}
                    <Table.Body>
                        {table.getRowModel().rows.map((row, index) => (
                            <Table.Row key={row.id} className={index % 2 ? "bg-gray-100" : "bg-white"}>
                                <Table.Cell className="px-4 py-2.5">
                                    <Checkbox
                                        {...{
                                            checked: row.getIsSelected(),
                                            disabled: !row.getCanSelect(),
                                            onChange: row.getToggleSelectedHandler(),
                                        }}
                                    />
                                </Table.Cell>
                                {row.getVisibleCells().map(cell => (
                                    <Table.Cell className="text-gray-700 px-0 py-2.5" key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
            <div className="flex justify-center items-center space-x-2 my-4">
                <button
                    className="border rounded p-1"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<<'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    {'>'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    {'>>'}
                </button>
                <span className="flex items-center gap-1">
                    <div>Page</div>
                    <strong>
                        {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </strong>
                </span>
                <span className="flex items-center gap-1">
                    | Go to page:
                    <input
                        type="number"
                        min="1"
                        max={table.getPageCount()}
                        defaultValue={table.getState().pagination.pageIndex + 1}
                        onChange={e => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0;
                            table.setPageIndex(page);
                        }}
                        className="border p-1 rounded w-16"
                    />
                </span>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value));
                    }}
                >
                    {[5, 10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}

export default TableCustom;
