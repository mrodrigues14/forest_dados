import { useState } from "react";

export default function ChecagemPage() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [valorMinimo, setValorMinimo] = useState<string>("500.000,00"); // Valor formatado
  const [result, setResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Formatar CPF ou CNPJ corretamente
  const formatarCpfCnpj = (value: string) => {
    value = value.replace(/\D/g, ""); // Remove tudo que não for número
    if (value.length === 11) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); // CPF
    } else if (value.length === 14) {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"); // CNPJ
    }
    return value;
  };

  // Formatar valor como moeda (R$1.000,00)
  const formatarMoeda = (value: number | string) => {
    let numero = typeof value === "number" ? value.toString() : value;
    numero = numero.replace(/\D/g, ""); // Remove tudo que não for número
    if (!numero) return "R$ 0,00";
  
    // Converte para número e formata corretamente
    let formatted = (parseFloat(numero) / 100).toLocaleString("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    });
  
    return formatted;
  };
  

  // Atualiza o estado ao digitar o valor mínimo
  const handleValorMinimoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    setValorMinimo(formatarMoeda(value));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file1 || !file2) {
      alert("Por favor, envie as duas planilhas.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file1", file1);
    formData.append("file2", file2);
    formData.append("valorMinimo", valorMinimo.replace(/[R$\.,]/g, "")); // Enviar valor sem formatação

    try {
      const response = await fetch("/api/checagem", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log(data)
      setResult(data);
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
      alert("Erro ao processar os arquivos. Verifique os formatos e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Checagem de CPFs/CNPJs</h1>

      <div className="mb-3">
        <label className="form-label">Upload da Planilha de Multas:</label>
        <input type="file" className="form-control" onChange={(e) => handleFileChange(e, setFile1)} />
      </div>

      <div className="mb-3">
        <label className="form-label">Upload da Planilha de Embargos:</label>
        <input type="file" className="form-control" onChange={(e) => handleFileChange(e, setFile2)} />
      </div>

      <div className="mb-3">
        <label className="form-label">Valor mínimo da multa (R$):</label>
        <input 
          type="text" 
          className="form-control"
          value={valorMinimo} 
          onChange={handleValorMinimoChange} 
        />
      </div>

      <button className="btn btn-primary w-100" onClick={handleSubmit} disabled={loading}>
        {loading ? "Processando..." : "Checar Dados"}
      </button>

      {result.length > 0 && (
        <div className="mt-4">
          <h3>Resultados:</h3>
          <ul className="list-group">
            {result.map((item, index) => (
              <li key={index} className="list-group-item">
              <strong>{formatarCpfCnpj(item.cpfcnpj)}</strong> - {item.nome} - Multa: {formatarMoeda(item.valorMulta)}
            </li>
            
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
