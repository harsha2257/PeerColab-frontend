import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const API_URL = "https://your-backend-name.up.railway.app";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedProfile = localStorage.getItem("profile");

    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser));
      setProfile(JSON.parse(savedProfile));
    }

    setLoading(false);
  }, []);

  async function signIn(idOrEmail, password) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: idOrEmail,
          email: idOrEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data || !data.id) {
        return {
          error: {
            message: "Invalid credentials",
          },
        };
      }

      const userData = {
        id: data.id,
        email: data.email,
      };

      const profileData = {
        id: data.id,
        role: data.role,
        full_name: data.full_name,
        email: data.email,
      };

      setUser(userData);
      setProfile(profileData);

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("profile", JSON.stringify(profileData));

      return { error: null };
    } catch (err) {
      console.log("Login error:", err);
      return {
        error: {
          message: "Server connection failed",
        },
      };
    }
  }

  function signOut() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
  }

  async function signUpStudent(data) {
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          password: data.password,
          role: "student",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: result.error || result.message || "Signup failed",
          },
        };
      }

      return { error: null };
    } catch (err) {
      console.log("Signup error:", err);
      return {
        error: {
          message: "Server connection failed",
        },
      };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUpStudent,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}