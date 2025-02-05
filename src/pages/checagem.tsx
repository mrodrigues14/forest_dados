import { useState } from "react";

// Formatar valor como moeda (R$1.000,00)
const formatarMoedaInput = (value: string | number) => {
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  if (!value) return "R$ 0,00";

  // Remove apenas pontos que são separadores de milhar (mantendo o separador decimal)
  let numero = value.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  let parsed = parseFloat(numero);
  if (isNaN(parsed)) return "R$ 0,00";
  console.log(parsed)
  return parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};;

const formatarMoeda = (value: string | number) => {
  console.log(value);

  // Converte para número caso seja string
  let numero = typeof value === "string" ? parseInt(value, 10) : value;

  // Garante que seja um número válido
  if (isNaN(numero)) return "0,00";

  // Divide por 100 para considerar os centavos
  let valorCorrigido = numero / 100;

  return valorCorrigido.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Teste
console.log(formatarMoeda(12760074)); // "127.600,74






export default function ChecagemPage() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [valorMinimo, setValorMinimo] = useState<string>("500000"); // Agora armazenamos sem formatação
  const [valorMinimoFormatado, setValorMinimoFormatado] = useState<string>(formatarMoedaInput("500000")); // Armazena o valor formatado
  const [result, setResult] = useState<any | null>(null);
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

  // Atualiza o estado ao digitar o valor mínimo (sem formatação)
  const handleValorMinimoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/\D/g, ""); 
    let valueForamted = (parseFloat(value) / 100).toString();
    setValorMinimo(valueForamted);
    
    if (value.length > 0) {
      setValorMinimoFormatado(formatarMoedaInput(value));
    } else {
      setValorMinimoFormatado("R$ 0,00");
    }
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
    formData.append("valorMinimo", valorMinimo.toString()); // Agora enviamos um número corretamente


    try {
      const response = await fetch("/api/checagem", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
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
          value={formatarMoedaInput(valorMinimo)} 
          onChange={handleValorMinimoChange} 
        />
      </div>

      <button className="btn btn-primary w-100" onClick={handleSubmit} disabled={loading}>
        {loading ? "Processando..." : "Checar Dados"}
      </button>

      {/* Exibir detalhes do CPF consultado */}
      {result && result.cpf && (
        <div className="mt-4">
          <h3>Dados do CPF Consultado</h3>
          <ul className="list-group">
            <li className="list-group-item"><strong>CPF:</strong> {formatarCpfCnpj(result.cpf)}</li>
            <li className="list-group-item"><strong>Nome:</strong> {result.nome || "Não encontrado"}</li>
            <li className="list-group-item"><strong>Multa:</strong> {formatarMoeda(result.valorMulta)}</li>
            <li className="list-group-item">
              <strong>Telefones:</strong> {result.telefones?.length > 0 ? result.telefones.join(", ") : "Não encontrado"}
            </li>
            <li className="list-group-item">
              <strong>Emails:</strong> {result.emails?.length > 0 ? result.emails.join(", ") : "Não encontrado"}
            </li>
          </ul>
        </div>
      )}

      {/* Exibir lista de outros CPFs/CNPJs encontrados */}
      {result && Array.isArray(result.outros) && result.outros.length > 0 && (
        <div className="mt-4">
          <h3>Outros CPFs/CNPJs Encontrados</h3>
          <ul className="list-group">
            {result.outros.map((item: { cpfcnpj: string; valorMulta: number }, index: number) => (
              <li key={index} className="list-group-item">
                <strong>{formatarCpfCnpj(item.cpfcnpj)}</strong> - Multa: R${formatarMoeda(item.valorMulta)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
