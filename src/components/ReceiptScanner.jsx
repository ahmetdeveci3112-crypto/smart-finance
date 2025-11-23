import { useState, useRef } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { analyzeReceipt } from "../lib/gemini";
import { mockAnalyzeReceipt } from "../lib/mockService";
import { useAuth } from "../context/AuthContext";

export default function ReceiptScanner({ onScanComplete }) {
    const { isDemo } = useAuth();
    const [scanning, setScanning] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanning(true);
        try {
            if (isDemo) {
                const result = await mockAnalyzeReceipt();
                onScanComplete(result, file);
            } else {
                const result = await analyzeReceipt(file);
                onScanComplete(result, file);
            }
        } catch (error) {
            console.error("Scan failed:", error);
            alert(`Fiş okunamadı: ${error.message || "Bilinmeyen hata"}`);
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="mb-6">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="w-full py-3 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2"
            >
                {scanning ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Yapay Zeka Fişi Okuyor...
                    </>
                ) : (
                    <>
                        <Camera className="w-5 h-5" />
                        Fiş Tara (Otomatik Doldur)
                    </>
                )}
            </button>
        </div>
    );
}
