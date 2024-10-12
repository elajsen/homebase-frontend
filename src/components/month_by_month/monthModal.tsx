"use client";

import { useRouter } from "next/navigation"

import MonthData from "./interfaces"

interface MonthModalProps{
    monthData: MonthData
}


const styles: { [key:string]: React.CSSProperties } = {
    modal: {
        display: "flex",
        flexDirection:"column",
        border: "solid",
        borderWidth: 1,
        borderRadius: 10,
        margin: 10,
        padding: 10,
        width: "20%"
    },
    row: {
        display:"flex",
        flexDirection:"row",
    },
    leftMargin: {
        marginLeft: "7px"
    },
    redTextColor: {
        color: "red"
    },
    greenTextColor: {
        color: "green"
    }
}

function MonthModal({ monthData }: MonthModalProps){
    const router = useRouter();
    const profit = parseFloat((monthData.income -  monthData.spending).toFixed(2))
    const textColorStyle = profit < 0 ? styles.redTextColor : styles.greenTextColor

    return (
        <div style={styles.modal} onClick={() => {router.push("/monthly_budget?date=" + monthData.start_date)}}>
            <div style={styles.row}>
                <p>{monthData.start_date}</p>
                <p style={styles.leftMargin}>-</p>
                <p style={styles.leftMargin}>{monthData.end_date}</p>
            </div>
            <div style={styles.row}>
                <p>Income: €{monthData.income}</p>
                <p style={styles.leftMargin}>Spending: €{monthData.spending}</p>
            </div>

            <p style={textColorStyle}>Profit: €{profit}</p>
        </div>
    )
}
export default MonthModal