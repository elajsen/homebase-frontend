import React from "react"

export interface WeekData {
    start_date: string,
    end_date: string,
    income: number,
    spending: number,
    remaining_days: number,
    disposableIncomePerDay: number
}

const style: React.CSSProperties = {
    border: "solid",
    borderWidth: 1,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    margin: 10
}

const innerDivStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row"
}

const WeekModal = ({
    start_date, end_date, spending, income,
    remaining_days, disposableIncomePerDay }:WeekData) => {
    const disposableIncome = parseFloat((disposableIncomePerDay * remaining_days).toFixed(2));

    return (
        <div style={style}>
            <div style={innerDivStyle}>
                <p>{start_date}</p>
                <p>{end_date}</p>
            </div>
            <p>{spending}</p>
            <p>{income}</p>
            <p>{disposableIncome}</p>
        </div>
    )
}
export default WeekModal;