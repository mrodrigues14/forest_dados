import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === "teste@email.com" && password === "123") {
      localStorage.setItem("token", "user_authenticated"); // Salva o token no localStorage
      router.push("/"); // Redireciona para a página inicial
    } else {
      setError("E-mail ou senha incorretos.");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="mb-3">
        <label className="form-label">E-mail</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="mb-3">
        <label className="form-label">Senha</label>
        <input
          type="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary w-100">Entrar</button>
    </form>
  );
}
