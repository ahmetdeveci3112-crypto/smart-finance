import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);

    async function login() {
        if (!auth) {
            alert("Firebase is not configured. Please use Demo Mode.");
            return;
        }
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Create user document if it doesn't exist
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp(),
                });
            }
            setIsDemo(false);
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    }

    function loginDemo() {
        setIsDemo(true);
        setCurrentUser({
            uid: "demo-user",
            displayName: "Demo User",
            email: "demo@example.com",
            photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
        });
        setLoading(false);
    }

    function logout() {
        if (isDemo) {
            setIsDemo(false);
            setCurrentUser(null);
            return Promise.resolve();
        }
        if (!auth) return Promise.resolve();
        return signOut(auth);
    }

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!isDemo) {
                setCurrentUser(user);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [isDemo]);

    const value = {
        currentUser,
        login,
        loginDemo,
        logout,
        loading,
        isDemo
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
