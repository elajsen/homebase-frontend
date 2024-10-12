import React from "react"
import { useState } from "react"
import { Transaction } from "./interfaces"
import TransactionDataTable from "./transaction_data_table"


interface UnpaidBillsData {
    thisMonthTotalBills: number,
    lastMonthTotalBills: number,
    upcomingBills: Transaction[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTransactionVisibility: any
}

const styles: { [key:string ]: React.CSSProperties } = {
    container: {
        flex:1,
        border: "solid",
        borderWidth: 1,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        margin: 10,
        padding: 10
    }
}

const UpcomingBills = ({ thisMonthTotalBills, lastMonthTotalBills, upcomingBills, updateTransactionVisibility }: UnpaidBillsData) => {
    const [showTable, setShowTable] = useState(false)
    const remainingBillsAmountThisMonth = parseFloat((lastMonthTotalBills - thisMonthTotalBills).toFixed(2))

    const btnValue = showTable ? "Show Upcoming Bills" : "Hide Upcoming Bills"
    const dataTable = showTable ? <TransactionDataTable tableData={upcomingBills} updateTransactionVisibility={updateTransactionVisibility} />: null

    return (
        <div style={styles.container}>
            <p>Remaining bills amount: €{remainingBillsAmountThisMonth}</p>
            <button
                style={styles.btnStyle}
                title="Hide Transactions Table"
                onClick={() => {setShowTable((prevState) => {return !prevState})}}
            >{btnValue}</button>
            {dataTable}
        </div>
    )
}
export default UpcomingBills