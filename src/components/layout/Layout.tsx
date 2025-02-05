import Navbar from "./NavBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      <main className="container mt-4">{children}</main>
      <footer className="text-center mt-4">
        <p>&copy; {new Date().getFullYear()} Forest Dados</p>
      </footer>
    </div>
  );
}
