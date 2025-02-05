import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h2 className="text-center mb-4">Login</h2>
        <LoginForm />
      </div>
    </div>
  );
}
