/* eslint-disable prettier/prettier */
import Hubsoft from "../../models/Hubsoft";
// Importe o modelo Hubsoft
interface HubsoftData {
  // eslint-disable-next-line camelcase
  client_id: number;
  host: string;
  client_secret: string;
  username: string;
  password: string;
  grant_type: string;
}

// Função para definir os dados do Hubsoft na tabela Hubsoft
const createHubsoftUser = async (
  hubsoftData: HubsoftData
): Promise<Hubsoft> => {
  try {
    // Crie um novo registro na tabela Hubsoft com os dados fornecidos
    const hubsoft = await Hubsoft.create(hubsoftData);
    console.log("Dados do Hubsoft definidos com sucesso:", hubsoftData);
    return hubsoft;
  } catch (error) {
    console.error("Erro ao definir dados do Hubsoft:", error);
    throw error; // Rejeite a Promise se ocorrer algum erro
  }
};

export default createHubsoftUser;
