import axios, { AxiosResponse } from "axios";
import createToken from "./createToken";
import Hubsoft from "../../models/Hubsoft";



const desbloqueioConfianca = async (idClienteServico: string): Promise<any> => {
  try {
    // Chama a função getToken
    const hubsoft = await Hubsoft.findOne({
      attributes: ["id","username", "password", "client_id", "client_secret", "grant_type", "host", "access_token"]
    });
    if (!hubsoft) {
      throw new Error("Dados de autenticação não encontrados no banco de dados");
    }
    
    // Faz a solicitação HTTP GET para obter o cliente
      const response = await axios.post<any>(`${hubsoft.host}/api/v1/integracao/cliente/desbloqueio_confianca`, JSON.stringify({
        id_cliente_servico: idClienteServico,
        dias_desbloqueio: "3"
      }), {
        headers: {
          "Content-Type": "application/json",
           Authorization: `Bearer ${hubsoft.access_token}`
        }
      })
    

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
        const response = await axios.post<any>(`${hubsoft.host}/api/v1/integracao/cliente/desbloqueio_confianca`,
         JSON.stringify({
            id_cliente_servico: idClienteServico,
            dias_desbloqueio: "3"
          }), {
            headers: {
              "Content-Type": "application/json",
               Authorization: `Bearer ${hubsoft.access_token}`
            }
          })
        // Retorna as faturas se a solicitação for bem-sucedida após obter um novo token
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error(`Erro ao obter desbloqueio de confianca após atualização do token: ${response.statusText}`);
        }
      } catch (tokenError) {
        throw new Error(`Erro ao obter desbloqueio após atualização do token:: ${tokenError.response?.data || tokenError.message}`);
      }
    } else {
      // Se ocorrer outro tipo de erro, lança uma exceção
      throw error;
    }
  }
};

export default desbloqueioConfianca;
