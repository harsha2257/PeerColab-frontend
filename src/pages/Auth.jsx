import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { signIn, signUpStudent } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    fullName: "",
    loginId: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleLogin(e) {
    e.preventDefault();

    const loginValue = form.loginId || form.email;
    const { error } = await signIn(loginValue, form.password);

    if (error) {
      setMessage("User ID or password does not match");
    } else {
      setMessage("Login success");
      navigate("/");
    }
  }

  async function handleSignup(e) {
    e.preventDefault();

    const { error } = await signUpStudent({
      id: form.loginId,
      full_name: form.fullName,
      email: form.email,
      password: form.password,
    });

    if (error) {
      setMessage(error.message || "Signup failed");
    } else {
      setMessage("Student registered successfully");
      setMode("login");
      setForm({
        fullName: "",
        loginId: "",
        email: "",
        password: "",
      });
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <h1>PeerColab</h1>
          <p>Peer Review System</p>
        </div>

        <div className="auth-right">
          <div className="tab-row">
            <button
              type="button"
              className={mode === "login" ? "tab active-tab" : "tab"}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={mode === "signup" ? "tab active-tab" : "tab"}
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
            >
              Signup
            </button>
          </div>

          {mode === "login" ? (
            <form className="form-grid" onSubmit={handleLogin}>
              <input
                name="loginId"
                type="text"
                placeholder="User ID or Email"
                value={form.loginId}
                onChange={handleChange}
                required
              />

              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button type="submit" className="primary-btn">
                Login
              </button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={handleSignup}>
              <input
                name="fullName"
                placeholder="Full Name"
                value={form.fullName}
                onChange={handleChange}
                required
              />

              <input
                name="loginId"
                placeholder="Student ID"
                value={form.loginId}
                onChange={handleChange}
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button type="submit" className="primary-btn">
                Signup
              </button>
            </form>
          )}

          {message && <p style={{ marginTop: "10px" }}>{message}</p>}
        </div>
      </div>
    </div>
  );
}