import { Modal } from "flowbite-react"
import { FunctionComponent, useEffect } from "react"
import { formatCurrency } from "../helper"


interface CarryDetailsModalProps {
    projectHeads : { [key: string]: number[] }
    projectExpenses: { [key: string]: number }
    formerYear: number
    carryData: { [key: string]: number[] }
    isOpen: boolean
    onClose: () => void
}

export const CarryDetailsModal: FunctionComponent<CarryDetailsModalProps> = ({ projectHeads, projectExpenses, formerYear, carryData, isOpen, onClose }) => {

    useEffect(() => {
        console.log(projectExpenses)
    },[projectExpenses])

    console.log(carryData)

    const totalCarryAmount = Object.values(carryData).reduce((sum, arr) => sum + (arr[formerYear - 1] || 0), 0)
    const totalExpenseAmount = Object.values(projectExpenses).reduce((sum, expense) => sum + (expense || 0), 0)
    const totalFormerYearAmount = Object.values(projectHeads).reduce((sum, arr) => sum + (arr[formerYear - 1] || 0), 0)
    const totalYearAmount = Object.values(projectHeads).reduce((sum, arr) => sum + (arr[formerYear] || 0), 0)

    return (
        <Modal size='6xl' show={isOpen} onClose={onClose}>
            <Modal.Header>Carry Information from Year {formerYear} to Year {formerYear + 1}</Modal.Header>
            <Modal.Body>
                {carryData ? (
                    <table className="min-w-full bg-white rounded-lg">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-3 px-6 text-center text-gray-800 font-semibold">Project Head</th>
                                <th className="py-3 px-6 text-center text-gray-800 font-semibold">Year {formerYear} Amount</th>
                                <th className="py-3 px-6 text-center text-gray-800 font-semibold">Year {formerYear} Expenses</th>
                                <th className="py-3 px-6 text-center text-gray-800 font-semibold">Year {formerYear} Balance</th>
                                <th className="py-3 px-6 text-center text-gray-800 font-semibold">Year {formerYear} Carry</th>
                                <th className="py-3 px-6 text-center text-gray-800 font-semibold">Year {formerYear + 1} Amount</th>
                                <th className="py-3 px-6 text-center text-gray-800 font-semibold">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(projectHeads).map(([head, alloc], key) => (
                                <tr key={key} className="border-t">
                                    <td className="py-3 px-6 text-center text-gray-600">{head}</td>
                                    <td className="py-3 px-6 text-center text-gray-600">{formatCurrency(alloc[formerYear-1])}</td>
                                    <td className="py-3 px-6 text-center text-gray-600">{formatCurrency(projectExpenses[head] ?? 0)}</td>
                                    <td className="py-3 px-6 text-center text-gray-600">{formatCurrency(alloc[formerYear-1] - (projectExpenses[head] ?? 0))}</td>
                                    <td className="py-3 px-6 text-center text-gray-600">{formatCurrency(carryData[head][formerYear-1])}</td>
                                    <td className="py-3 px-6 text-center text-gray-600">{formatCurrency(alloc[formerYear])}</td>
                                    <td className="py-3 px-6 text-center text-gray-600 font-bold">{formatCurrency(projectHeads[head][formerYear] + carryData[head][formerYear - 1])}</td>
                                    </tr>
                            ))}
                            <tr className="border-t bg-gray-100 font-semibold">
                                <td className="py-3 px-6 text-center">Total Amount</td>
                                <td className="py-3 px-6 text-center">{formatCurrency(totalFormerYearAmount)}</td>
                                <td className="py-3 px-6 text-center">{formatCurrency(totalExpenseAmount)}</td>
                                <td className="py-3 px-6 text-center">{formatCurrency(totalFormerYearAmount - totalExpenseAmount)}</td>
                                <td className="py-3 px-6 text-center">{formatCurrency(totalCarryAmount)}</td>
                                <td className="py-3 px-6 text-center">{formatCurrency(totalYearAmount)}</td>
                                <td className="py-3 px-6 text-center">{formatCurrency(totalYearAmount + totalCarryAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p>No carry information available for this year.</p>
                )}
            </Modal.Body>
        </Modal>
    )
}