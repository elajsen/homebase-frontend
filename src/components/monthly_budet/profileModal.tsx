import { useState } from "react";
import TransactionDataTable from "./transaction_data_table";
import { Transaction } from "./interfaces";


interface ProfileModalData {
    salary: number
    savings: number
    spending: number
    income: number
    transactions: Transaction[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateState: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTransactionVisibility: any
}

const style: React.CSSProperties = {
    border: "solid",
    borderWidth: 1,
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    margin: 10,
    padding: 10
}

const ProfileModal = ({ salary, savings, spending, income, transactions, updateState, updateTransactionVisibility}: ProfileModalData) => {
    const [showTable, setShowTable] = useState(false);

    const btnValue = showTable ? "Hide Transactions" : "Show Transactions" 
    const dataTable = showTable ? <TransactionDataTable tableData={transactions} updateTransactionVisibility={updateTransactionVisibility} />: null

    spending = parseFloat(spending.toFixed(2))
    income = parseFloat(income.toFixed(2))
    const profit = parseFloat((income + spending).toFixed(2))

    return (
        <div style={style}>
            <div>
                <div>
                    <p>Salary</p>
                    <input onChange={(e) => {updateState("salary", e.target.value)}} value={salary.toString()}></input>
                </div>
                <div>
                    <p>Savings</p>
                    <input onChange={(e) => {updateState("savings", e.target.value)}} value={savings.toString()}></input>
                </div>
                <div>
                    <button
                        onClick={() => {setShowTable((prevState) => {return !prevState})}}
                    >{btnValue}</button>
                    {dataTable}
                </div>
            </div>
            <div>
                <p>Income: €{income}</p>
                <p>Spending: €{spending}</p>
                <p>Profit: €{profit}</p>
            </div>
        </div>
    )
}
export default ProfileModal