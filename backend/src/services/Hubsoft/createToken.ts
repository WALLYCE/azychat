/* eslint-disable prettier/prettier */
/* eslint-disable camelcase */
import axios from "axios";
import Hubsoft from "../../models/Hubsoft"; // Importe o modelo Hubsoft
import auth from "../../config/auth";
import { json } from "body-parser";
var FormData = require('form-data');
interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

const createToken = async (): Promise<Boolean> => {
  try {
    // Obtenha os dados necessários para autenticação da tabela Hubsoft no banco de dados
    // eslint-disable-next-line prettier/prettier
    const hubsoft = await Hubsoft.findOne({
      attributes: ["id","username", "password", "client_id", "client_secret", "grant_type", "host"]
    });
    if (!hubsoft) {
      throw new Error("Dados de autenticação não encontrados no banco de dados");
    }
    // Construa o objeto de dados de autenticação

   
    // Construa a URL completa para a solicitação POST
    const tokenUrl = `${hubsoft.host}/oauth/token`;

    // Faça uma solicitação POST para obter o token de acesso
    const response = await axios.post<any>(tokenUrl, JSON.stringify({
      grant_type: hubsoft.grant_type,
      client_id: hubsoft.client_id,
      client_secret: hubsoft.client_secret,
      username: hubsoft.username,
      password: hubsoft.password
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    })
  
  
    // Extraia os tokens de acesso da resposta
    const { access_token, refresh_token } = response.data;
    
    console.log("Token de acesso obtido com sucesso:", access_token);
    console.log("Refresh token:", refresh_token);
    
    // Salve os tokens de acesso e atualização (refresh token) no banco de dados
    await hubsoft.update({
      access_token: access_token,
      refresh_token: refresh_token
    });

    console.log("Tokens salvos no banco de dados com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao obter e salvar os tokens (createToken):", error.response?.data || error.message);
    return false;
    
  }
  
};

export default createToken;
