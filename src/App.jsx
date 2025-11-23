import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import { Loader2 } from "lucide-react";

function App() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!currentUser) {
        return <Login />;
    }

    return (
        <Layout>
            <Dashboard />
        </Layout>
    );
}

export default App;
