"use client"

import React from "react";
import { Component } from "react";
import { Transaction } from "@/components/monthly_budet/interfaces";
import WeekModal, { WeekData } from "@/components/monthly_budet/weekModal";
import ProfileModal from "@/components/monthly_budet/profileModal";
import HouseBills from "@/components/monthly_budet/house_bill";
import UpcomingBills from "@/components/monthly_budet/upcoming_bills";


interface State {
    date: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    month: Record<string, any>;
    weeks: WeekData[];
    thisMonthTransactions: Transaction[];
    lastMonthHouseBills: Transaction[];
    thisMonthHouseBills: Transaction[];
    upcomingHouseBills: Transaction[];
    billsDelta: number;
    salary: number;
    savings: number;
    totalIncome: number;
    totalSpending: number;
    totalRemainingDays: number;
    lastMonthTotalBills: number;
    thisMonthTotalBills: number;
}

interface Props{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any[],
    searchParams: {
        date: string
    } | null
}

const styles: { [key:string]: React.CSSProperties } = {
    weeklyBreakdownStyle: {
        display:"flex",
        flexDirection:"row",
        justifyContent: "space-around"
    },
    fullPageStyle: {
        display: "flex",
        flexDirection: "column"
    },
    billsContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        gap:"10px"
    },
    billsItem: {
        flex:1,
        display:"flex"
    }
}

class MonthlyBudget extends Component<object, State>{
    constructor(props: Props) {
        super(props);

        let date: string
        if (props.searchParams && props.searchParams.date){
            date = props.searchParams.date
        } else {
            const dateObj = new Date()
            date = dateObj.toISOString().split('T')[0]
        }
        console.log("date", date)

        const salary = parseFloat(localStorage.getItem("salary") ?? "0")
        const savings = parseFloat(localStorage.getItem("savings") ?? "0")

        this.state = {
            date: date,
            month: {},
            weeks: [],
            thisMonthTransactions: [],
            thisMonthHouseBills: [],
            lastMonthHouseBills: [],
            upcomingHouseBills: [],
            billsDelta: 0,
            salary: salary,
            savings: savings,
            totalIncome: 0,
            totalSpending: 0,
            totalRemainingDays: 0,
            lastMonthTotalBills: 0,
            thisMonthTotalBills: 0
        };
        this.updateItemInState = this.updateItemInState.bind(this);
        this.updateTransactionVisibility = this.updateTransactionVisibility.bind(this);
    }

    updateItemInState(item:string, newValue:string){
        if (item == "savings") {
            this.setState((prevState) => {
                return {
                    ...prevState,
                    savings: parseFloat(newValue)
                }
            })
            localStorage.setItem("savings", newValue)
        } else if (item == "salary") {
            this.setState((prevState) => {
                return {
                    ...prevState,
                    salary: parseFloat(newValue),

                }
            })
            localStorage.setItem("salary", newValue)
        } else if (item == "billsDelta") {
            this.setState((prevState) => {
                return {
                    ...prevState,
                    billsDelta: parseFloat(newValue),
                }
            })
        }
    }

    async updateTransactionVisibility(transaction_id: string, newValue: boolean){
        console.log("Transaction id: ", transaction_id, " to -> ", newValue)
        const changeTransactionVisibilityURL = "http://0.0.0.0:8000/v1/transactions/set_visibility/"

        const params = new URLSearchParams({
            transaction_id: transaction_id,
            is_visible: String(newValue)
        })
        const response = await fetch(changeTransactionVisibilityURL + "?" + params, {method: "POST"})
        if (response.status == 200){
            console.log("Change the things")
            this.setState((prevState) => {
                const updatedTransactions = prevState.thisMonthTransactions.map((transaction) => {
                    if (transaction.transaction_id === transaction_id) {
                        return { ...transaction, is_visible: newValue };
                    }
                    return transaction;
                });
    
                return {
                    ...prevState,
                    thisMonthTransactions: updatedTransactions
                };
            })
        }
    }

    getFirstLastDateOfMonth = () => {
        const date = new Date(this.state.date);
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const firstDayStr = firstDay.toLocaleDateString('en-CA');
        const lastDayStr = lastDay.toLocaleDateString('en-CA');

        return { firstDay: firstDayStr, lastDay: lastDayStr };
    }

    getIndividualTransactions = async () => {
        const houseBillsUrl = "http://0.0.0.0:8000/v1/house_bills"
        const upcomingHouseBillsUrl = "http://0.0.0.0:8000/v1/house_bills/upcoming"
        const monthlyTransactions = "http://0.0.0.0:8000/v1/transactions/"

        const dates = this.getFirstLastDateOfMonth()
        const firstDay = dates.firstDay
        const lastDay = dates.lastDay

        const date = new Date(this.state.date)
        const today = date.toISOString().split('T')[0];        
        date.setDate(0)
        const lastMonth = date.toISOString().slice(0, 10);

        const thisMonthParams = new URLSearchParams({
            date: today,
        })
        const lastMonthParams = new URLSearchParams({
            date: lastMonth,
        })
        const thisMonthRangeParams = new URLSearchParams({
            date_from: firstDay,
            date_to: lastDay
        })

        const lastMonthBillsResponse = await fetch(houseBillsUrl + "?" + lastMonthParams)
        const thisMonthBillsResponse = await fetch(houseBillsUrl + "?" + thisMonthParams)
        const upcomingHouseBillsResponse = await fetch(upcomingHouseBillsUrl + "?" + thisMonthParams)
        const thisMonthTransactionsResponse = await fetch(monthlyTransactions + "?" + thisMonthRangeParams)

        const lastMonthBills = await lastMonthBillsResponse.json()
        const thisMonthBills = await thisMonthBillsResponse.json()
        const upcomingHouseBills = await upcomingHouseBillsResponse.json()
        const thisMonthTransactions = await thisMonthTransactionsResponse.json()

        this.setState((prevState) => {
            return {
                ...prevState,
                thisMonthTransactions: thisMonthTransactions,
                thisMonthHouseBills: thisMonthBills,
                lastMonthHouseBills: lastMonthBills,
                upcomingHouseBills: upcomingHouseBills,
            }
        })
    }

    getBudgetData = async () => {
        const monthUrl = "http://0.0.0.0:8000/v1/budget/month"
        const weeksUrl = "http://0.0.0.0:8000/v1/budget/weeks"

        const date = new Date(this.state.date);
        const today = date.toISOString().slice(0, 10);
        const params = new URLSearchParams({
            date: today,
        })
        const monthsParams = new URLSearchParams({
            date_from: today,
        })

        const monthDataResponse = await fetch(monthUrl + "?" + monthsParams)
        const weeksDataResponse = await fetch(weeksUrl + "?" + params)
        
        const monthData = await monthDataResponse.json()
        const weeksData = await weeksDataResponse.json()

        console.log("Month data: ", monthData);

        this.setState((prevState) => {
            return {
                ...prevState,
                month: monthData,
                weeks: weeksData,
                totalRemainingDays: monthData.remaining_days,
            }
        })
    }

    getTotalsData = async () => {
        const totalHouseBillsUrl = "http://0.0.0.0:8000/v1/house_bills/total"

        const date = new Date(this.state.date)
        const today = date.toISOString().split('T')[0];        
        date.setDate(0)
        const lastMonth = date.toISOString().slice(0, 10);

        const thisMonthParams = new URLSearchParams({
            date: today,
        })
        const lastMonthParams = new URLSearchParams({
            date: lastMonth,
        })

        const lastMonthTotalBillsResponse = await fetch(totalHouseBillsUrl + "?" + lastMonthParams)
        const thisMonthTotalBillsResponse = await fetch(totalHouseBillsUrl + "?" + thisMonthParams)
        
        const lastMonthTotalBills = await lastMonthTotalBillsResponse.json()
        const thisMonthTotalBills = await thisMonthTotalBillsResponse.json()

        this.setState((prevState) => {
            return {
                ...prevState,
                thisMonthTotalBills: parseFloat(thisMonthTotalBills.amount.toFixed(2)),
                lastMonthTotalBills: parseFloat(lastMonthTotalBills.amount.toFixed(2))
            }
        })
    }

    getTransactions = async () => {
        const monthUrl = "http://0.0.0.0:8000/v1/budget/month"
        const weeksUrl = "http://0.0.0.0:8000/v1/budget/weeks"
        const totalHouseBillsUrl = "http://0.0.0.0:8000/v1/house_bills/total"
        const houseBillsUrl = "http://0.0.0.0:8000/v1/house_bills"
        const upcomingHouseBillsUrl = "http://0.0.0.0:8000/v1/house_bills/upcoming"
        const monthlyTransactions = "http://0.0.0.0:8000/v1/transactions/"

        const date = new Date(this.state.date);
        const today = date.toISOString().slice(0, 10);
        date.setDate(0)
        const lastMonth = date.toISOString().slice(0, 10);
        const dates = this.getFirstLastDateOfMonth()
        const firstDay = dates.firstDay
        const lastDay = dates.lastDay

        const params = new URLSearchParams({
            date: today,
        })
        const dateFromParams = new URLSearchParams({
            date_from: today,
        })
        const houseBillsParams = new URLSearchParams({
            date: lastMonth
        })
        const thisMonthRangeParams = new URLSearchParams({
            date_from: firstDay,
            date_to: lastDay
        })

        try {
            const monthDataResponse = await fetch(monthUrl + "?" + dateFromParams)
            const weeksDataResponse = await fetch(weeksUrl + "?" + params)
            const thisMonthTransactionsResponse = await fetch(monthlyTransactions + "?" + thisMonthRangeParams)
            const lastMonthTotalBillsResponse = await fetch(totalHouseBillsUrl + "?" + houseBillsParams)
            const thisMonthTotalBillsResponse = await fetch(totalHouseBillsUrl + "?" + params)
            const lastMonthBillsResponse = await fetch(houseBillsUrl + "?" + houseBillsParams)
            const thisMonthBillsResponse = await fetch(houseBillsUrl + "?" + params)
            const upcomingHouseBillsResponse = await fetch(upcomingHouseBillsUrl + "?" + params)

            const monthDataList = await monthDataResponse.json()
            const monthData = monthDataList[0]
            const weeksData = await weeksDataResponse.json()
            const thisMonthTransactions = await thisMonthTransactionsResponse.json()
            const lastMonthTotalBills = await lastMonthTotalBillsResponse.json()
            const thisMonthTotalBills = await thisMonthTotalBillsResponse.json()
            const lastMonthBills = await lastMonthBillsResponse.json()
            const thisMonthBills = await thisMonthBillsResponse.json()
            const upcomingHouseBills = await upcomingHouseBillsResponse.json()

            const totalSpending = this.state.weeks.reduce((total: number, week: WeekData) => {
                return total + week.spending;
            }, 0)
            const totalIncome = this.state.weeks.reduce((total: number, week: WeekData) => {
                return total + week.income;
            }, 0)

            this.setState({
                month: monthData,
                weeks: weeksData,
                thisMonthTransactions: thisMonthTransactions,
                thisMonthHouseBills: thisMonthBills,
                lastMonthHouseBills: lastMonthBills,
                upcomingHouseBills: upcomingHouseBills,
                billsDelta: lastMonthTotalBills["amount"] - thisMonthTotalBills["amount"],
                totalIncome: parseFloat(totalIncome.toFixed(2)),
                totalSpending: parseFloat(totalSpending.toFixed(2)),
                totalRemainingDays: monthData.remaining_days,
                thisMonthTotalBills: parseFloat(thisMonthTotalBills.amount.toFixed(2)),
                lastMonthTotalBills: parseFloat(lastMonthTotalBills.amount.toFixed(2))
            })
        } catch (error){
            console.error("ERROR", error)
        }
    }

    componentDidMount() {
        this.getTransactions()
    }

    render() {
        console.log(this.state)
        const remainingAmount = parseFloat((
            this.state.totalIncome - this.state.totalSpending -
            this.state.savings + this.state.salary - Math.abs(this.state.billsDelta)).toFixed(2))
        const disposableIncomePerDay = parseFloat((remainingAmount / this.state.totalRemainingDays).toFixed(2))
        const weeks = this.state.weeks.map((week, index) => {
            return <WeekModal 
                key={index}
                start_date={week.start_date}
                end_date={week.end_date}
                income={week.income}
                spending={week.spending}
                remaining_days={week.remaining_days}
                disposableIncomePerDay={disposableIncomePerDay}
            />
        })

        return (
            <div style={styles.fullPageStyle}>
                <div>
                    <ProfileModal
                        salary={this.state.salary}
                        savings={this.state.savings}
                        spending={this.state.totalSpending}
                        income={this.state.totalIncome}
                        transactions={this.state.thisMonthTransactions}
                        updateState={this.updateItemInState}
                        updateTransactionVisibility={this.updateTransactionVisibility}
                    />
                </div>
                <div style={styles.weeklyBreakdownStyle}>
                    {weeks}
                </div>
                <div style={styles.billsContainer}>
                    <div style={styles.billsItem}>
                        <HouseBills
                            thisMonthHouseBills={this.state.thisMonthHouseBills}
                            thisMonthTotalBills={this.state.thisMonthTotalBills}
                            lastMonthTotalBills={this.state.lastMonthTotalBills}
                            updateState={this.updateItemInState}
                            updateTransactionVisibility={this.updateTransactionVisibility}
                        />
                    </div>
                    <div style={styles.billsItem}>
                        <UpcomingBills
                            thisMonthTotalBills={this.state.thisMonthTotalBills}
                            lastMonthTotalBills={this.state.lastMonthTotalBills}
                            upcomingBills={this.state.upcomingHouseBills}
                            updateTransactionVisibility={this.updateTransactionVisibility}
                        />
                    </div>
                </div>
            </div>
            
        )
    };
  };
  
  export default MonthlyBudget;
  