import React, { useState } from "react";

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const API_LOGIN = (typeof process !== "undefined" && process.env.REACT_APP_API_URL)
    ? `${process.env.REACT_APP_API_URL}/auth/login`
    : "http://localhost:3000/api/auth/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }
    try {
      const res = await fetch(API_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const errMsg = await res.text();
        console.error("Login failed:", errMsg);
        throw new Error("Đăng nhập thất bại");
      }
      const data = await res.json();
      console.log("Login success data:", data);
      localStorage.setItem("token", data.token);
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      // Truyền token, role, leaderId cho onLogin
      onLogin?.({ username, role: payload.role, token: data.token, leaderId: data.leaderId });
    } catch (err) {
      console.error(err);
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center bg-white">
      <div className="row shadow rounded overflow-hidden w-75" style={{ maxWidth: "1000px" }}>
        {/* Left: Form */}
        <div className="col-md-6 p-5">
          <h2 className="fw-bold mb-1">Đăng nhập</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Tên đăng nhập</label>
              <input
                type="text"
                className="form-control"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-control"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="alert alert-danger py-1">{error}</div>}

            <div className="mb-3 text-end">
              <a href="#" className="text-primary text-decoration-none">Bạn quên mật khẩu?</a>
            </div>
            <button type="submit" className="btn btn-primary w-100">Đăng nhập</button>
          </form>

          <hr className="my-4" />
        </div>

        {/* Right: Image */}
        <div className="col-md-6 bg-light d-flex justify-content-center align-items-center p-4">
          <img
            src="https://cdn.undraw.co/illustration/creative-woman_su2h.svg"
            alt="Event Login Illustration"
            className="img-fluid"
            style={{ maxHeight: "350px" }}
          />
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
