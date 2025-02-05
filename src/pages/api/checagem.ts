import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

// Configuração para permitir upload de arquivos no Next.js API Routes
export const config = { api: { bodyParser: false } };

// Tipagem para Multas
interface Multa {
    cpfcnpj: string;
    valorMulta: number;
}

// Função para salvar arquivos temporários
const saveFile = async (file: File): Promise<string> => {
    const data = fs.readFileSync(file.filepath);
    const filePath = path.join(process.cwd(), "public", file.originalFilename || "temp.xlsx");
    fs.writeFileSync(filePath, data);
    return filePath;
};

const formatarNumero = (valor: string): number => {
    // Remove espaços e caracteres inválidos
    let numero = valor.trim().replace(/\s/g, "");

    // Se contiver uma vírgula seguida de dígitos, assumimos que é decimal
    if (numero.includes(",") && numero.match(/,\d+$/)) {
        numero = numero.replace(/\./g, "").replace(",", ".");
    } else {
        // Caso contrário, apenas removemos separadores errados
        numero = numero.replace(/\./g, "");
    }

    return parseFloat(numero) || 0;
};

// Função para processar arquivos Excel e comparar dados
const processarArquivos = async (planilha1Path: string, planilha2Path: string, valorMinimo: number): Promise<Multa[]> => {
    const workbook1 = new ExcelJS.Workbook();
    const workbook2 = new ExcelJS.Workbook();

    await workbook1.xlsx.readFile(planilha1Path);
    await workbook2.xlsx.readFile(planilha2Path);

    const sheet1 = workbook1.worksheets[0];
    const sheet2 = workbook2.worksheets[0];

    const listaMultas: Multa[] = [];
    const listaEmbargos: string[] = [];

    // Processar planilha 1 (Multas)
    // Lista de status que devem ser removidos
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
    ];
    
    // Processar planilha 1 (Multas)
    sheet1.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const cpfcnpj: string = row.getCell(7).text?.replace(/\D/g, "") || "";
            const valorMulta: number = parseFloat(row.getCell(11).text?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0");
            const statusDebito: string = row.getCell(13).text?.trim() || ""; // Ajuste para a coluna correta do Status Débito
    
            // Manter apenas os registros com status válidos
            if (statusValidos.includes(statusDebito) && valorMulta >= valorMinimo) {
                listaMultas.push({ cpfcnpj, valorMulta });
            }
        }
    });
    


    // Processar planilha 2 (Embargos)
    // Processar planilha 2 (Embargos)
    sheet2.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const rowValues = sheet2.getRow(1).values;
            if (Array.isArray(rowValues)) {
                const cpfcnpj: string = row.getCell( // Alterando a posição da coluna correta
                    rowValues.findIndex((cell: any) =>
                        typeof cell === "string" && cell.toLowerCase().includes("cpf ou cnpj")
                    )
                )?.text?.replace(/\D/g, "") || "";

                if (cpfcnpj) listaEmbargos.push(cpfcnpj);
            } else {
                console.error('Row values are not an array');
            }
        }
    });


    // Comparar CPFs/CNPJs e exibir apenas os que aparecem nas duas planilhas
    const cpfsComuns: Multa[] = listaMultas.filter(multa => listaEmbargos.includes(multa.cpfcnpj));

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
            console.log(valorMinimo)
            const planilha1File = files.file1 ? (Array.isArray(files.file1) ? files.file1[0] : files.file1) : undefined;
            const planilha2File = files.file2 ? (Array.isArray(files.file2) ? files.file2[0] : files.file2) : undefined;


            if (!planilha1File || !planilha2File) {
                return res.status(400).json({ message: "Ambos os arquivos são obrigatórios." });
            }

            const planilha1Path = await saveFile(planilha1File);
            const planilha2Path = await saveFile(planilha2File);

            const resultado: Multa[] = await processarArquivos(planilha1Path, planilha2Path, valorMinimo);
            console.log(resultado)
            return res.status(200).json(resultado);
        } catch (error) {
            console.error("Erro interno no servidor:", error);
            return res.status(500).json({ message: "Erro interno no servidor", error });
        }
    });
}
