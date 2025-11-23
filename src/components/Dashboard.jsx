import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, TrendingUp, TrendingDown, Loader2, Receipt, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import TransactionForm from "./TransactionForm";
import TransactionDetailModal from "./TransactionDetailModal";
import Charts from "./Charts";
import { mockStore } from "../lib/mockService";

export default function Dashboard() {
    const { currentUser, isDemo } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        if (!currentUser) return;

        if (isDemo) {
            const unsubscribe = mockStore.subscribe((data) => {
                setTransactions(data);
                setLoading(false);
            });
            return unsubscribe;
        }

        if (!db && !isDemo) {
            console.error("Firestore database is not initialized.");
            setLoading(false);
            alert("Veritabanı bağlantısı kurulamadı. Lütfen API anahtarlarınızı kontrol edin.");
            return;
        }

        const q = query(
            collection(db, "users", currentUser.uid, "transactions"),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(docs);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
            if (error.code === 'permission-denied') {
                alert("Veritabanı erişim izni yok. Lütfen Firebase Console'dan Firestore kurallarını kontrol edin.");
            } else {
                alert("Veri yüklenirken bir hata oluştu: " + error.message);
            }
        });

        return unsubscribe;
    }, [currentUser, isDemo]);

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent opening detail modal
        if (confirm("Bu işlemi silmek istediğinize emin misiniz?")) {
            if (isDemo) {
                mockStore.deleteTransaction(id);
            } else {
                await deleteDoc(doc(db, "users", currentUser.uid, "transactions", id));
            }
        }
    };

    const handleExportCSV = () => {
        const headers = ["Tarih", "Başlık", "Kategori", "Tutar", "Tür"];
        const csvContent = [
            headers.join(","),
            ...transactions.map(t => [
                t.date,
                `"${t.title}"`,
                t.category,
                t.amount,
                t.type
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `islemler_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const balance = income - expense;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Genel Bakış</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors font-medium border border-zinc-200 dark:border-zinc-700"
                        title="CSV Olarak İndir"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Dışa Aktar</span>
                    </button>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-medium shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10"
                    >
                        <Plus className="w-4 h-4" />
                        İşlem Ekle
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Toplam Bakiye</p>
                    <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(balance)}</h3>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Gelir</p>
                    </div>
                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(income)}</h3>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Gider</p>
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(expense)}</h3>
                </div>
            </div>

            {/* Charts */}
            <Charts transactions={transactions} />

            {/* Transactions List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Son İşlemler</h2>
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                            Henüz işlem yok. Başlamak için bir tane ekleyin!
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {transactions.map((t) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setSelectedTransaction(t)}
                                    className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center",
                                            t.type === 'income'
                                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                        )}>
                                            {t.type === 'income' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-base text-zinc-900 dark:text-zinc-100">{t.title}</h4>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(t.date)} • {t.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "font-bold text-lg",
                                            t.type === 'income' ? "text-green-600 dark:text-green-400" : "text-zinc-900 dark:text-zinc-100"
                                        )}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </span>
                                        {t.receiptUrl && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedReceipt(t.receiptUrl);
                                                }}
                                                className="p-2 text-zinc-400 hover:text-indigo-500 transition-all"
                                                title="Fişi Gör"
                                            >
                                                <Receipt className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(e, t.id)}
                                            className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isFormOpen && (
                    <TransactionForm onClose={() => setIsFormOpen(false)} />
                )}
                {selectedTransaction && (
                    <TransactionDetailModal
                        transaction={selectedTransaction}
                        onClose={() => setSelectedTransaction(null)}
                    />
                )}
                {selectedReceipt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <img src={selectedReceipt} alt="Receipt" className="w-full h-full object-contain" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
