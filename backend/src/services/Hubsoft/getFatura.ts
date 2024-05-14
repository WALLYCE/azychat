import axios, { AxiosResponse } from "axios";
import createToken from "./createToken";
import Hubsoft from "../../models/Hubsoft";
import getCliente from "./getCliente";


const getFatura = async (cpf: string, datainicio: string, datafim: string): Promise<any> => {
  try {
    // Chama a função getToken
   
    const hubsoft = await Hubsoft.findOne({
      attributes: ["id","username", "password", "client_id", "client_secret", "grant_type", "host", "access_token"]
    });
    if (!hubsoft) {
      throw new Error("Dados de autenticação não encontrados no banco de dados");
    }
    
    // Faz a solicitação HTTP GET para obter as faturas do cliente
    const response: AxiosResponse<any> = await axios.get(
      `${hubsoft.host}/api/v1/integracao/cliente/financeiro?busca=cpf_cnpj&termo_busca=${cpf}&apenas_pendente=sim&data_inicio=${datainicio}&data_fim=${datafim}`,
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
      throw new Error(`Erro ao obter boletos: ${response.statusText}`);
    }
  } catch (error) {
    // Trata erros de requisição
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        // Se receber HTTP 401, tenta obter um novo token e faz a requisição novamente
       const newToken = await createToken();

       if(newToken){
        const hubsoft_new = await Hubsoft.findOne({
          attributes: ["id","username", "password", "client_id", "client_secret", "grant_type", "host", "access_token"]
        });
        console.log(hubsoft_new)
        if (!hubsoft_new) {
          throw new Error("Dados de autenticação não encontrados no banco de dados");
        }

        const response: AxiosResponse<any> = await axios.get(
          `${hubsoft_new.host}/api/v1/integracao/cliente/financeiro?busca=cpf_cnpj&termo_busca=${cpf}&apenas_pendente=sim&data_inicio=${datainicio}&data_fim=${datafim}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${hubsoft_new.access_token}`
            }
          }
        );
        // Retorna as faturas se a solicitação for bem-sucedida após obter um novo token
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error(`Erro ao obter boletos após atualização do token: ${response.statusText}`);
        }
       }else{
        const hubsoft_new = await Hubsoft.findOne({
          attributes: ["id","username", "password", "client_id", "client_secret", "grant_type", "host", "access_token"]
        });
        if (!hubsoft_new) {
          throw new Error("Dados de autenticação não encontrados no banco de dados");
        }
      
        const response: AxiosResponse<any> = await axios.get(
          `${hubsoft_new.host}/api/v1/integracao/cliente/financeiro?busca=cpf_cnpj&termo_busca=${cpf}&apenas_pendente=sim&data_inicio=${datainicio}&data_fim=${datafim}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${hubsoft_new.access_token}`
            }
          }
        );
        // Retorna as faturas se a solicitação for bem-sucedida após obter um novo token
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error(`Erro ao obter o novo token`);
        }
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

export default getFatura;
