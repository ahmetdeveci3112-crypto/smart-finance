import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { X, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import ReceiptScanner from "./ReceiptScanner";
import { mockStore, mockUploadImage } from "../lib/mockService";

export default function TransactionForm({ onClose }) {
    const { currentUser, isDemo } = useAuth();
    const [loading, setLoading] = useState(false);
    const [receiptFile, setReceiptFile] = useState(null);
    const [customCategory, setCustomCategory] = useState("");
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        type: "expense",
        category: "food",
        date: new Date().toISOString().split('T')[0]
    });

    const handleScanComplete = (data, file) => {
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            amount: data.amount || prev.amount,
            date: data.date ? data.date.split('T')[0] : prev.date,
            category: data.category_guess || prev.category
        }));
        if (file) setReceiptFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let receiptUrl = null;

            // Upload Receipt Image
            if (receiptFile) {
                if (isDemo) {
                    receiptUrl = await mockUploadImage(receiptFile);
                } else if (storage) {
                    const storageRef = ref(storage, `receipts/${currentUser.uid}/${Date.now()}_${receiptFile.name}`);
                    await uploadBytes(storageRef, receiptFile);
                    receiptUrl = await getDownloadURL(storageRef);
                }
            }

            const transactionData = {
                title: formData.title,
                amount: Number(formData.amount),
                type: formData.type,
                category: isCustomCategory ? customCategory : formData.category,
                date: formData.date,
                receiptUrl: receiptUrl,
                createdAt: serverTimestamp()
            };

            if (isDemo) {
                mockStore.addTransaction(transactionData);
            } else {
                await addDoc(collection(db, "users", currentUser.uid, "transactions"), transactionData);
            }
            onClose();
        } catch (error) {
            console.error("Error adding transaction:", error);
            alert("İşlem eklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
            >
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">İşlem Ekle</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>

                <div className="p-6">
                    <ReceiptScanner onScanComplete={handleScanComplete} />

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Başlık</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Örn: Market Alışverişi"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tutar</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tür</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="expense">Gider</option>
                                    <option value="income">Gelir</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kategori</label>
                                {!isCustomCategory ? (
                                    <select
                                        value={formData.category}
                                        onChange={e => {
                                            if (e.target.value === 'custom') setIsCustomCategory(true);
                                            else setFormData({ ...formData, category: e.target.value });
                                        }}
                                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="food">Yeme & İçme</option>
                                        <option value="transport">Ulaşım</option>
                                        <option value="shopping">Alışveriş</option>
                                        <option value="bills">Faturalar</option>
                                        <option value="salary">Maaş</option>
                                        <option value="other">Diğer</option>
                                        <option value="custom">+ Özel Kategori Ekle</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customCategory}
                                            onChange={e => setCustomCategory(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Kategori Adı"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomCategory(false)}
                                            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tarih</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kaydet"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
