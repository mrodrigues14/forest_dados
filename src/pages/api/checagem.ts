import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { consultarCPF } from "../../utils/consultarDados"; // Importa a função de consulta de CPF

export const config = { api: { bodyParser: false } };

interface Multa {
    cpfcnpj: string;
    valorMulta: number;
}

const saveFile = async (file: File): Promise<string> => {
    const data = fs.readFileSync(file.filepath);
    const filePath = path.join(process.cwd(), "public", file.originalFilename || "temp.xlsx");
    fs.writeFileSync(filePath, data);
    return filePath;
};

const formatarNumero = (valor: string): number => {
    let numero = valor.trim().replace(/\s/g, "");

    if (numero.includes(",")) {
        // Substitui os separadores e mantém as casas decimais
        numero = numero.replace(/\./g, "").replace(",", ".");
    } else {
        // Se não tiver casas decimais, multiplica por 100 para representar centavos
        return parseFloat(numero) * 100;
    }

    return parseFloat(numero) || 0;
};


const processarArquivos = async (planilha1Path: string, planilha2Path: string, valorMinimo: number): Promise<Multa[]> => {
    const workbook1 = new ExcelJS.Workbook();
    const workbook2 = new ExcelJS.Workbook();

    await workbook1.xlsx.readFile(planilha1Path);
    await workbook2.xlsx.readFile(planilha2Path);

    const sheet1 = workbook1.worksheets[0];
    const sheet2 = workbook2.worksheets[0];

    const listaMultas: Multa[] = [];
    const listaEmbargos: Set<string> = new Set();

    const statusValidos = [
        "800 - Quitado por pagamento de parcelamento tipo PRD",
        "Baixado por adesão a conversão de multa",
        "Baixado por determinação judicial",
        "Cancelado",
        "Cancelado na homologação (AI sem defesa)",
        "Cancelado por falecimento ocorrido antes da const. do créd.",
        "Excluído",
        "Excluído devido a duplicidade de lançamento",
        "Insuficiência de dados p/cobrança administrativa",
        "Quitado no sapiens Dívida"
    ];

    const normalizarCpfCnpj = (valor: string) => valor.replace(/\D/g, "");

    // Processar planilha 1 (Multas)
    sheet1.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const cpfcnpj = normalizarCpfCnpj(row.getCell(7).text || "");
            const valorMulta: number = formatarNumero(row.getCell(11).text || "0");
            let statusDebito: string = row.getCell(13).text?.trim() || "";

            statusDebito = statusDebito.toLowerCase();
            const statusEhValido = statusValidos.some(status => status.toLowerCase() === statusDebito);

            if (statusEhValido && valorMulta >= valorMinimo) {
                listaMultas.push({ cpfcnpj, valorMulta });
            }
        }
    });

    sheet2.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const headerRow = sheet2.getRow(1).values;
            if (Array.isArray(headerRow)) {
                const colIndex = headerRow.findIndex((cell: any) =>
                    typeof cell === "string" && cell.toLowerCase().includes("cpf ou cnpj")
                );

                if (colIndex === -1) {
                    console.error("Coluna 'CPF ou CNPJ' não encontrada na planilha de embargos.");
                    return;
                }

                const cpfcnpjCell = row.getCell(colIndex);
                const cpfcnpj: string = cpfcnpjCell?.text?.replace(/\D/g, "") || "";
                if (cpfcnpj) listaEmbargos.add(cpfcnpj);
            } else {
                console.error("Erro: A primeira linha da planilha não contém valores válidos.");
            }
        }
    });

    const cpfsComuns: Multa[] = listaMultas.filter(multa => listaEmbargos.has(multa.cpfcnpj));

    return cpfsComuns;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Método não permitido" });
    }

    const form = formidable();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Erro no parse do formulário:", err);
            return res.status(500).json({ message: "Erro ao processar o upload", error: err.message });
        }
        try {
            const valorMinimoStr = Array.isArray(fields.valorMinimo) ? fields.valorMinimo[0] : fields.valorMinimo;
            const valorMinimo = parseFloat(valorMinimoStr || "500000");

            const planilha1File = files.file1 ? (Array.isArray(files.file1) ? files.file1[0] : files.file1) : undefined;
            const planilha2File = files.file2 ? (Array.isArray(files.file2) ? files.file2[0] : files.file2) : undefined;

            if (!planilha1File || !planilha2File) {
                return res.status(400).json({ message: "Ambos os arquivos são obrigatórios." });
            }

            const planilha1Path = await saveFile(planilha1File);
            const planilha2Path = await saveFile(planilha2File);

            const resultado: Multa[] = await processarArquivos(planilha1Path, planilha2Path, valorMinimo);

            if (resultado.length === 0) {
                return res.status(200).json({ message: "Nenhum CPF encontrado para consulta." });
            }

            // Pegar apenas 1 CPF para consulta
            const cpfSelecionado = resultado.find(item => item.cpfcnpj.length === 11)?.cpfcnpj || null;
            let dadosCPF = null;

            if (cpfSelecionado) {
                dadosCPF = await consultarCPF(cpfSelecionado);
            }

            return res.status(200).json({
                cpf: cpfSelecionado || "Nenhum CPF disponível",
                nome: dadosCPF?.nome || "Não encontrado",
                telefones: dadosCPF?.telefones || [],
                emails: dadosCPF?.emails || [],
                valorMulta: cpfSelecionado ? resultado.find(item => item.cpfcnpj === cpfSelecionado)?.valorMulta : null,
                outros: resultado.map(item => ({
                    cpfcnpj: item.cpfcnpj,
                    valorMulta: item.valorMulta
                }))
            });


        } catch (error) {
            console.error("Erro interno no servidor:", error);
            return res.status(500).json({ message: "Erro interno no servidor", error });
        }
    });
}
