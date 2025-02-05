import axios from "axios";

const API_URL = "https://ws.hubdodesenvolvedor.com.br/v2/cadastropf/";
const API_TOKEN = "169179765VcwsYSRdfX305448936"; // Substitua pelo seu token real

/**
 * Consulta um CPF na API de Dados Pessoais.
 * @param cpf - Número do CPF (somente números).
 * @returns Dados pessoais (nome, telefones, emails, endereços) ou `null` em caso de erro.
 */
export const consultarCPF = async (cpf: string) => {
    try {
        const response = await axios.get(`${API_URL}?cpf=${cpf}&token=${API_TOKEN}`);

        // Verifica se a API retornou sucesso
        if (response.data.return !== "OK") {
            console.error("Erro na consulta:", response.data.message);
            return null;
        }

        const dados = response.data.result;
        console.log(dados)
        return {
            nome: dados.nomeCompleto || "Não disponível",
            mae: dados.nomeDaMae || "Não disponível",
            nascimento: dados.dataDeNascimento || "Não disponível",
            idade: dados.anos || "Não informado",
            telefones: dados.listaTelefones?.map((t: any) => t.telefoneComDDD) || [],
            emails: dados.listaEmails?.map((e: any) => e.enderecoEmail) || [],
            enderecos: dados.listaEnderecos?.map((end: any) => ({
                logradouro: end.logradouro,
                numero: end.numero,
                bairro: end.bairro,
                cidade: end.cidade,
                estado: end.uf,
                cep: end.cep
            })) || []
        };
    } catch (error) {
        console.error("Erro ao consultar CPF:", error);
        return null;
    }
};
