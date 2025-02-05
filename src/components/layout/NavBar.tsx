import Link from "next/link";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove o token
    router.push("/login"); // Redireciona para a tela de login
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link href="/" className="navbar-brand">Forest Dados</Link>
        <div className="navbar-nav">
          <Link href="/checagem" className="nav-link">Checagem</Link>
          <Link href="/checklist" className="nav-link">Checklist</Link>
          <button onClick={handleLogout} className="btn btn-outline-danger ms-2">Sair</button>
        </div>
      </div>
    </nav>
  );
}
