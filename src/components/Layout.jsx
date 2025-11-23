import { useAuth } from "../context/AuthContext";
import { LogOut, Wallet } from "lucide-react";

export default function Layout({ children }) {
    const { currentUser, logout } = useAuth();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Smart Finance</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2">
                            <img
                                src={currentUser?.photoURL}
                                alt={currentUser?.displayName}
                                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700"
                            />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{currentUser?.displayName}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                            title="Çıkış Yap"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
