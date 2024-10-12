import React from "react"
import { Transaction } from "./interfaces"

interface TransactionDataTableData {
    tableData: Transaction[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTransactionVisibility: any
}

const styles: { [key:string]: React.CSSProperties} = {
    container: {
        display:"flex",
        flexDirection: "row"
    },
    tableColumns: {
        display:"flex",
        flexDirection:"column",
        margin: 5
    },
    cellData: {
        fontSize: "0.8em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        verticalAlign: "middle"
    },
    checkbox: {
        verticalAlign: "middle",  // Ensures the checkbox aligns with the text
        margin: 13.8
    }
}


const TransactionDataTable = ({ tableData, updateTransactionVisibility }: TransactionDataTableData) =>  {
    if (tableData.length == 0){
        return (<></>)
    }
    const columnNames: string[] = Object.keys(tableData[0])
    const columns: { [key:string]: JSX.Element[] } = columnNames.reduce((columnsDict, columnName) => {
        columnsDict[columnName] = [];
        return columnsDict
    }, {} as { [key:string]: JSX.Element[] })

    tableData.map((transaction, index) => {
        Object.keys(columns).map((columnName) => {
            if (columnName == 'is_visible'){
                const value = transaction.is_visible
                const inputTag = (
                    <input 
                        key={columnName + index}
                        type="checkbox"
                        checked={value}
                        style={{ ...styles.cellData, ...styles.checkbox }}
                        onChange={() => updateTransactionVisibility(transaction.transaction_id, !value)}
                    />
                )
                columns[columnName].push(inputTag)
            } else {
                const value = transaction[columnName as keyof Transaction];
                columns[columnName].push(<p key={columnName + index} style={styles.cellData}>{value}</p>)
            }
        })
    })

    const structuredTableData = Object.keys(columns).map((columnName, index) => {
        return (
            <div style={styles.tableColumns} key={index}>
                <p>{columnName}</p>
                {columns[columnName]}
            </div>
        )
    })

    return (
        <>
            <div style={styles.container}>
                {structuredTableData}
            </div>
        </>
    )
}
export default TransactionDataTable