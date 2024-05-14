import Hubsoft from "../../models/Hubsoft"; // Importe o modelo Hubsoft


const getToken = async (): Promise<string | null> => {
  try {
    // Obtenha os dados necessários para autenticação da tabela Hubsoft no banco de dados
    const hubsoft = await Hubsoft.findOne({
      attributes: ["access_token"]
    });
    if (!hubsoft) {
      console.error("Dados de autenticação não encontrados no banco de dados");
      return null;
    }

    // Retorna o token de acesso do banco de dados
    return hubsoft.access_token;
  } catch (error) {
    console.error("Erro ao recuperar o token do banco de dados:", error);
    return null;
  }
};
export default getToken;