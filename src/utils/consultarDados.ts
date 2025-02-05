// import fetch from "node-fetch";

// // Chave de API (substitua pela sua chave real)
// const API_KEY = "SUA_CHAVE_AQUI"; 
// const BASE_URL = "https://www.cnpj.ws/cnpj"; // Para CNPJs
// const BASE_URL_CPF = "https://www.cpfcnpj.com.br/api/consulta"; // Para CPFs

// // Função para buscar dados do CNPJ
// export const consultarCNPJ = async (cnpj: string) => {
//     try {
//         const response = await fetch(`${BASE_URL}/${cnpj}`, {
//             method: "GET",
//             headers: { "Content-Type": "application/json" },
//         });
//         const data = await response.json();
//         if (data && data.nome) {
//             return { nome: data.nome, telefone: data.telefone };
//         }
//         return null;
//     } catch (error) {
//         console.error("Erro ao consultar CNPJ:", error);
//         return null;
//     }
// };

// // Função para buscar dados do CPF (Se a API permitir)
// export const consultarCPF = async (cpf: string) => {
//     try {
//         const response = await fetch(`${BASE_URL_CPF}?cpf=${cpf}&token=${API_KEY}`, {
//             method: "GET",
//             headers: { "Content-Type": "application/json" },
//         });
//         const data = await response.json();
//         if (data && data.nome) {
//             return { nome: data.nome, telefone: data.telefone };
//         }
//         return null;
//     } catch (error) {
//         console.error("Erro ao consultar CPF:", error);
//         return null;
//     }
// };
