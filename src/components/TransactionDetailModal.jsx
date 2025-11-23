import { motion } from "framer-motion";
import { X, Calendar, Tag, FileText, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate, cn } from "../lib/utils";

export default function TransactionDetailModal({ transaction, onClose }) {
    if (!transaction) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">İşlem Detayı</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                            transaction.type === 'income'
                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                            {transaction.type === 'income' ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{transaction.title}</h3>
                        <p className={cn(
                            "text-3xl font-bold mt-2",
                            transaction.type === 'income' ? "text-green-600 dark:text-green-400" : "text-zinc-900 dark:text-zinc-100"
                        )}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                            <Calendar className="w-5 h-5 text-zinc-400" />
                            <div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Tarih</p>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(transaction.date)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                            <Tag className="w-5 h-5 text-zinc-400" />
                            <div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Kategori</p>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">{transaction.category}</p>
                            </div>
                        </div>

                        {transaction.receiptUrl && (
                            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                <Receipt className="w-5 h-5 text-zinc-400" />
                                <div className="flex-1">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Fiş Görseli</p>
                                    <a
                                        href={transaction.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                                    >
                                        Görüntüle
                                    </a>
                                </div>
                                <img src={transaction.receiptUrl} alt="Receipt Thumbnail" className="w-10 h-10 object-cover rounded-lg" />
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
