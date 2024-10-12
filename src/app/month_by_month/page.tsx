"use client"

import { Component } from "react";
import MonthData from "@/components/month_by_month/interfaces";
import MonthModal from "@/components/month_by_month/monthModal";


interface State{
    dataFetched: boolean;
    monthData: MonthData[];
    yearsWithData: [];
}

const styles: { [key:string]: React.CSSProperties } = {
    monthModalsDiv: {
        display: "flex",
        flexWrap: "wrap"
    },
    redTextColor: {
        color: "red"
    },
    greenTextColor: {
        color: "green"
    }
}

class MonthByMonth extends Component<object, State>{
    constructor(props: object){
        super(props);
        this.state = {
            dataFetched: false,
            monthData: [],
            yearsWithData: []
        }
    }

    getFirstLastDate(date: string){
        const firstDate = date.slice(0, 5) + "01" + date.slice(7, 10)
        const lastDate = date.slice(0, 5) + "12" + date.slice(7, 10)
        return [firstDate, lastDate]
    }

    async getMonthByMonthData(){
        if (this.state.dataFetched) return;

        const monthUrl = "http://0.0.0.0:8000/v1/budget/month"
        const existingYearsURL = "http://0.0.0.0:8000/v1/budget/years_with_data"

        const existingYearsDataResponse = await fetch(existingYearsURL)
        const yearsWithData = await existingYearsDataResponse.json()

        const dates = this.getFirstLastDate(yearsWithData[0] + "-01-01");

        const dateFromParams = new URLSearchParams({
            date_from: dates[0],
            date_to: dates[1]
        })

        const monthDataResponse = await fetch(monthUrl + "?" + dateFromParams)

        const monthData = await monthDataResponse.json()

        this.setState({
            monthData: monthData,
            yearsWithData: yearsWithData,
            dataFetched: true
        })
    }

    async yearSelectChange(newItem: string){
        console.log("New item: ", newItem)
        const monthUrl = "http://0.0.0.0:8000/v1/budget/month"

        const dates = this.getFirstLastDate(newItem + "-01-01");
        const dateFromParams = new URLSearchParams({
            date_from: dates[0],
            date_to: dates[1]
        })

        const monthDataResponse = await fetch(monthUrl + "?" + dateFromParams)
        const monthData = await monthDataResponse.json()

        this.setState((prevState) => ({
            ...prevState,
            monthData: monthData
        }))
    }

    componentDidMount(): void {
        this.getMonthByMonthData()
    }

    render(){
        const monthModals = this.state.dataFetched ? (
            this.state.monthData.map((monthData, index) => {
                return <MonthModal
                        key={index}
                        monthData={monthData}
                    />
            })
        ) : [];
        const totalSpending = this.state.monthData.reduce((prevVal, currentVal) => prevVal + currentVal.spending, 0);
        const totalIncome = this.state.monthData.reduce((prevVal, currentVal) => prevVal + currentVal.income, 0);
        const totalProfit = parseFloat((totalIncome - totalSpending).toFixed(2))
        const profitStyle = totalProfit < 0 ? styles.redTextColor : styles.greenTextColor

        const yearSelectOptions = this.state.yearsWithData.map((year, index) => {
            return <option value={year} key={index}>{year}</option>
        })

        return (
            <div>
                <div>
                    <select onChange={(e) => this.yearSelectChange(e.target.value)}>
                        {yearSelectOptions}
                    </select>
                    <p>Total Spending: €{totalSpending}</p>
                    <p>Total Income: €{totalIncome}</p>
                    <p style={profitStyle}>Total Profit: €{totalProfit}</p>
                </div>
                <div style={styles.monthModalsDiv}>
                    {monthModals}
                </div>
                
            </div>
        )
    }
}

export default MonthByMonth 