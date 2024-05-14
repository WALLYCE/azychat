import axios, { AxiosResponse } from "axios";
import createToken from "./createToken";
import Hubsoft from "../../models/Hubsoft";



const getCliente = async (cpf: string): Promise<any> => {
  try {
    // Chama a função getToken
    const hubsoft = await Hubsoft.findOne({
      attributes: ["id","username", "password", "client_id", "client_secret", "grant_type", "host", "access_token"]
    });
    if (!hubsoft) {
      throw new Error("Dados de autenticação não encontrados no banco de dados");
    }
    
    // Faz a solicitação HTTP GET para obter o cliente
    const response: AxiosResponse<any> = await axios.get(
      `${hubsoft.host}/api/v1/integracao/cliente?busca=cpf_cnpj&termo_busca=${cpf}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hubsoft.access_token}`
        }
      }
    );

    // Verifica se a resposta foi bem-sucedida
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Erro ao obter cliente: ${response.statusText}`);
    }
  } catch (error) {
    // Trata erros de requisição
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        // Se receber HTTP 401, tenta obter um novo token e faz a requisição novamente
        const newToken = await createToken();
        const hubsoft = await Hubsoft.findOne({
          attributes: ["id","username", "password", "client_id", "client_secret", "grant_type", "host", "access_token"]
        });
        if (!hubsoft) {
          throw new Error("Dados de autenticação não encontrados no banco de dados");
        }
        const response: AxiosResponse<any> = await axios.get(
            `${hubsoft.host}/api/v1/integracao/cliente?busca=cpf_cnpj&termo_busca=${cpf}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`
              }
            }

        );
        // Retorna as faturas se a solicitação for bem-sucedida após obter um novo token
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error(`Erro ao obter cliente após atualização do token: ${response.statusText}`);
        }
      } catch (tokenError) {
        throw new Error(`Erro ao obter e salvar os tokens: ${tokenError.response?.data || tokenError.message}`);
      }
    } else {
      // Se ocorrer outro tipo de erro, lança uma exceção
      throw error;
    }
  }
};

export default getCliente;
