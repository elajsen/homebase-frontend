import React from "react"
import { useState } from "react"
import { Transaction } from "./interfaces"
import TransactionDataTable from "./transaction_data_table"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface HouseBillsData {
    thisMonthHouseBills: Transaction[],
    thisMonthTotalBills: number,
    lastMonthTotalBills: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateState: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTransactionVisibility: any
}

const styles: { [key: string]: React.CSSProperties} = {
    container: {
        flex:1,
        border: "solid",
        borderWidth: 1,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        margin: 10,
        padding: 10
    },
    billsAmountDiv: {
        display:"flex",
        flexDirection: "row",
        margin:10
    },
    billsAmountLine: {
        display:"flex",
        flexDirection:"row"
    },
    btnStyle: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        width: "20%"
    }
}

const HouseBills = ({ thisMonthHouseBills, thisMonthTotalBills, lastMonthTotalBills, updateState, updateTransactionVisibility }: HouseBillsData) => {
    const [showTable, setShowTable] = useState(false);
    const [currentMonthBillsSelected, setCurrentMonthBillsSelected] = useState(false)
    const [lastMonthBillsSelected, setLastMonthBillsSelected] = useState(true)

    const handleRadioClick = (valueToChange: string) => {
        if (valueToChange == "currentMonth"){
            setCurrentMonthBillsSelected(true)
            setLastMonthBillsSelected(false)

            updateState("billsDelta", 0)
        } else if (valueToChange == "prevMonth"){
            setCurrentMonthBillsSelected(false)
            setLastMonthBillsSelected(true)

            const billsDelta = lastMonthTotalBills - thisMonthTotalBills
            updateState("billsDelta", billsDelta)
        }
    }

    let btnValue = "Show Transactions Table"

    if (showTable){
        btnValue = "Hide Transactions Table"
    } else {
        btnValue = "Show Transactions Table"
    }

    const dataTable = showTable ? <TransactionDataTable tableData={thisMonthHouseBills} updateTransactionVisibility={updateTransactionVisibility} />: null

    return (
        <div style={styles.container}>
            <div style={styles.billsAmountDiv}>
                <div style={styles.billsAmountLine}>
                    <p>This month bills: €{thisMonthTotalBills}</p>
                    <input type="radio" name="" id=""
                    checked={currentMonthBillsSelected}
                    onChange={() => {handleRadioClick("currentMonth")}}/>
                </div>
                <div style={styles.billsAmountLine}>
                    <p>Last month bills: €{lastMonthTotalBills}</p>
                    <input type="radio" name="" id=""
                    checked={lastMonthBillsSelected}
                    onChange={() => {handleRadioClick("prevMonth")}}/>
                </div>
            </div>
            <button
                style={styles.btnStyle}
                title="Hide Transactions Table"
                onClick={() => {setShowTable((prevState) => {return !prevState})}}
            >{btnValue}</button>
            {dataTable}
        </div>
    )
}
export default HouseBills