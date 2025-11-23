import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

export default function Login() {
    const { login, loginDemo } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 text-center border border-zinc-100 dark:border-zinc-800"
            >
                <div className="flex justify-center mb-6">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full">
                        <Wallet className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Smart Finance'a Hoş Geldiniz</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8">Gelir ve giderlerinizi yapay zeka desteğiyle yönetin.</p>

                <div className="space-y-3">
                    <button
                        onClick={login}
                        className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 px-4 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Google ile Giriş Yap
                    </button>

                    <button
                        onClick={loginDemo}
                        className="w-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 py-3 px-4 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                    >
                        Demo Modunu Dene (Girişsiz)
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
