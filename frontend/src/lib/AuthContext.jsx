import React, { createContext, useState, useContext, useEffect } from "react";
import { sibaApi } from "@/api/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      setAppPublicSettings({ app_name: "SIBA" });
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      setAuthError({
        type: "unknown",
        message: error.message || "An unexpected error occurred",
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await sibaApi.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error("User auth check failed:", error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);

      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }
    }
  };

  const logout = () => {
    // Hapus token & panggil endpoint logout di backend
    sibaApi.auth.logout(null);
    // Reset state — App.jsx akan otomatis redirect ke /login
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
