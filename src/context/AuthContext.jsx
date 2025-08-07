import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  loginUser,
  registerUser,
  sessionUser,
  userLogout,
} from "../service/authService";
import Swal from "sweetalert2";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await sessionUser();
        if (data?.admin) {
          // If session exists
          setUser(data.admin);

          // If you're on a public page, send to role-based dashboard
          const publicPaths = ["/", "/login", "/register"];
          if (publicPaths.includes(location.pathname)) {
            navigate(`/${data.admin.role}`, { replace: true });
          }
        } else {
          // No session
          setUser(null);
          // Allow Landing + login + register
          const publicPaths = ["/", "/login", "/register"];
          if (!publicPaths.includes(location.pathname)) {
            navigate("/login", { replace: true });
          }
        }
      } catch (err) {
        setUser(null);
        const publicPaths = ["/", "/login", "/register"];
        if (!publicPaths.includes(location.pathname)) {
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [location.pathname, navigate]);

  /** LOGIN **/
  const login = async (formData) => {
    const res = await loginUser(formData);
    if (res) {
      const data = await sessionUser();
      if (data?.admin) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Login successful!",
          showConfirmButton: false,
          timer: 1500,
        });
        setUser(data.admin);
        navigate(`/${data.admin.role}`, { replace: true });
      } else {
        throw new Error("Failed to fetch user session");
      }
    } else {
      throw new Error("Login failed", res.message);
    }
  };

  /** REGISTER **/
  const register = async (formData) => {
    try {
      const res = await registerUser(formData);

      // Assuming a successful response does not include an error message
      if (res && !res.message) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Registration successful!",
          showConfirmButton: false,
          timer: 1500,
        });
        navigate(`/login`, { replace: true });
      } else {
        // Handle known error from backend
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: res.message || "Registration failed",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } catch (error) {
      // Handle unexpected errors
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: error.message || "Something went wrong",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  /** LOGOUT **/
  const logout = async () => {
    await userLogout();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
