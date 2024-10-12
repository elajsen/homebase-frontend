export interface Transaction {
    transaction_id: string;
    amount: number,
    category: string,
    subcategory: string,
    value_date: string,
    booking_date: string,
    is_visible: boolean
}