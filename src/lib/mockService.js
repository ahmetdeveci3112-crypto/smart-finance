export const MOCK_USER = {
    uid: "demo-user-123",
    displayName: "Demo User",
    email: "demo@example.com",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
};

class MockStore {
    constructor() {
        this.transactions = [
            {
                id: "t1",
                title: "Grocery Shopping",
                amount: 120.50,
                type: "expense",
                category: "food",
                date: new Date().toISOString(),
                createdAt: new Date().toISOString()
            },
            {
                id: "t2",
                title: "Monthly Salary",
                amount: 5000.00,
                type: "income",
                category: "salary",
                date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: "t3",
                title: "Netflix Subscription",
                amount: 15.99,
                type: "expense",
                category: "bills",
                date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                createdAt: new Date(Date.now() - 172800000).toISOString()
            }
        ];
        this.listeners = new Set();
    }

    subscribe(callback) {
        this.listeners.add(callback);
        callback(this.transactions);
        return () => this.listeners.delete(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.transactions));
    }

    addTransaction(transaction) {
        const newTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            ...transaction,
            createdAt: new Date().toISOString()
        };
        this.transactions = [newTransaction, ...this.transactions];
        this.notify();
        return newTransaction;
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.notify();
    }
}

export const mockStore = new MockStore();

export const mockAnalyzeReceipt = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    return {
        title: "Starbucks Coffee",
        amount: 12.50,
        date: new Date().toISOString(),
        category_guess: "food"
    };
};

export const mockUploadImage = async (file) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return URL.createObjectURL(file);
};
