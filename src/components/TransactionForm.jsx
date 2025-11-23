import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { X, Loader2, Plus, FileText, Receipt, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReceiptScanner from "./ReceiptScanner";
import { mockStore, mockUploadImage } from "../lib/mockService";
import { analyzeStatement } from "../lib/gemini";

// Image compression utility
const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    } else {
                        reject(new Error("Canvas to Blob conversion failed"));
                    }
                }, 'image/jpeg', 0.7);
            };
            img.onerror = (error) => reject(new Error("Image load failed: " + error));
        };
        reader.onerror = (error) => reject(new Error("File read failed: " + error));
    });
};

export default function TransactionForm({ onClose }) {
    const { currentUser, isDemo } = useAuth();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('single'); // 'single' | 'statement'

    // Single Transaction State
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

    // Statement State
    const [statementTransactions, setStatementTransactions] = useState([]);
    const statementInputRef = useRef(null);

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

    const handleStatementUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const transactions = await analyzeStatement(file);
            setStatementTransactions(transactions);
        } catch (error) {
            console.error(error);
            alert("Ekstre analiz edilemedi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const removeStatementItem = (index) => {
        setStatementTransactions(prev => prev.filter((_, i) => i !== index));
    };

    const handleBulkSave = async () => {
        setLoading(true);
        try {
            const batch = writeBatch(db);

            statementTransactions.forEach(tx => {
                const docRef = doc(collection(db, "users", currentUser.uid, "transactions"));
                batch.set(docRef, {
                    ...tx,
                    createdAt: serverTimestamp(),
                    receiptUrl: null // Statements usually don't have per-transaction receipts
                });
            });

            await batch.commit();
            onClose();
        } catch (error) {
            console.error("Bulk save error:", error);
            alert("Toplu kayıt sırasında hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let receiptUrl = null;

            // Upload Receipt Image with Compression
            if (receiptFile) {
                if (isDemo) {
                    receiptUrl = await mockUploadImage(receiptFile);
                } else if (storage) {
                    const compressedFile = await compressImage(receiptFile);
                    const storageRef = ref(storage, `receipts/${currentUser.uid}/${Date.now()}_${compressedFile.name}`);
                    await uploadBytes(storageRef, compressedFile);
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
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
            >
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setMode('single')}
                            className={`text-sm font-medium transition-colors ${mode === 'single' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}
                        >
                            Tek İşlem
                        </button>
                        <button
                            onClick={() => setMode('statement')}
                            className={`text-sm font-medium transition-colors ${mode === 'statement' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}
                        >
                            Ekstre Yükle (Toplu)
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>

                <div className="p-6">
                    {mode === 'single' ? (
                        <>
                            <ReceiptScanner onScanComplete={handleScanComplete} />

                            {receiptFile && (
                                <div className="mb-6 relative group">
                                    <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <img
                                            src={URL.createObjectURL(receiptFile)}
                                            alt="Fiş Önizleme"
                                            className="h-full object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setReceiptFile(null)}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                            title="Fişi Kaldır"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

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
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                    Kredi kartı ekstrenizi veya banka dökümünüzü (Resim veya PDF) yükleyin. Yapay zeka tüm işlemleri otomatik olarak listeyeleyecektir.
                                </p>
                            </div>

                            <input
                                type="file"
                                ref={statementInputRef}
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={handleStatementUpload}
                            />

                            {statementTransactions.length === 0 ? (
                                <button
                                    onClick={() => statementInputRef.current?.click()}
                                    disabled={loading}
                                    className="w-full py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 hover:border-indigo-500 hover:text-indigo-600 transition-all flex flex-col items-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : (
                                        <FileText className="w-8 h-8" />
                                    )}
                                    <span className="font-medium">Ekstre Dosyası Seçin</span>
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                                            Bulunan İşlemler ({statementTransactions.length})
                                        </h3>
                                        <button
                                            onClick={() => setStatementTransactions([])}
                                            className="text-xs text-red-500 hover:text-red-600"
                                        >
                                            Temizle
                                        </button>
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                        {statementTransactions.map((tx, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{tx.title}</div>
                                                    <div className="text-xs text-zinc-500">{tx.date} • {tx.category}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-medium text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                                    </span>
                                                    <button
                                                        onClick={() => removeStatementItem(idx)}
                                                        className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleBulkSave}
                                        disabled={loading}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Tümünü Kaydet
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
