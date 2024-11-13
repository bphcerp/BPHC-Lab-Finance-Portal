export interface Category {
    _id: string;
    name: string;
}

export interface Member {
    _id: string;
    name: string;
}

export interface Expense {
    _id: string;
    expenseReason: string;
    category: Category;
    amount: number;
    reimbursedID: Reimbursement | null;
    paidBy: Category;
    description: string
    settled: Account | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface EditExpenseData {
    expenseReason: string;
    category: string;
    amount: number;
    paidBy: string;
}

export interface MemberExpense {
    memberId: string;
    memberName: string;
    totalPaid: number;
    totalSettled: number;
    totalDue: number;
}

export interface Reimbursement {
    _id: string;
    project: Project;
    totalAmount: number;
    createdAt: Date;
    title: string;
    expenses: { expenseReason: string; amount: number }[];
    projectHead: string;
    paidStatus: boolean;
    description: string
}

export interface Installment {
    start_date: string;
    end_date: string;
}

export interface Project {
    _id?: string;
    project_name: string;
    start_date: Date | null;
    end_date: Date | null;
    project_heads: {
        [key: string]: number[];
    };
    project_head_expenses: {
        [key: string]: number
    }
    project_type: string;
    installments?: Installment[];
    total_amount: number;
    pis: string[];
    copis: string[];
    sanction_letter?: File | null;
    sanction_letter_file_id?: string;
    description: string
    negative_heads : string[]
}

export interface Account {
    _id: string
    amount: number;
    createdAt : Date
    type: 'Current' | 'Savings' | 'PDA' | 'PDF' | null;
    remarks?: string;
    credited: boolean;
    transferable: number;
}


export type Inputs = {
    selectedConfig: string
}