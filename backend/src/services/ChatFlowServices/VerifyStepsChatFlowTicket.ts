/* eslint-disable no-return-assign */
import { Message as WbotMessage } from "whatsapp-web.js";
import socketEmit from "../../helpers/socketEmit";
import Ticket from "../../models/Ticket";
import CreateMessageSystemService from "../MessageServices/CreateMessageSystemService";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import BuildSendMessageService from "./BuildSendMessageService";
import DefinedUserBotService from "./DefinedUserBotService";
import IsContactTest from "./IsContactTest";
import Whatsapp from "../../models/Whatsapp";
import { pupa } from "../../utils/pupa"
import getFatura from "../Hubsoft/getFatura";
import getCliente from "../Hubsoft/getCliente";
import desbloqueioConfianca from "../Hubsoft/desbloqueioConfianca";
import { DownloaderHelper } from 'node-downloader-helper';


interface MessageRequest {
  data: {
    message?: string;
    values?: string[];
    caption?: string;
    ext?: string;
    mediaUrl?: string;
    name?: string;
    type?: string;
  };
  id: string;
  type: "MessageField" | "MessageOptionsField" | "MediaField";
}

const isNextSteps = async (
  ticket: Ticket,
  chatFlow: any,
  step: any,
  stepCondition: any
): Promise<void> => {
  // action = 0: enviar para proximo step: nextStepId
  if (stepCondition.action === 0) {
    await ticket.update({
      stepChatFlow: stepCondition.nextStepId,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    const nodesList = [...chatFlow.flow.nodeList];

    /// pegar os dados do proximo step
    const nextStep = nodesList.find(
      (n: any) => n.id === stepCondition.nextStepId
    );

    if (!nextStep) return;

    for (const interaction of nextStep.interactions) {
      await BuildSendMessageService({
        msg: interaction,
        tenantId: ticket.tenantId,
        ticket
      });
    }
    // await SetTicketMessagesAsRead(ticket);
  }
};

const isQueueDefine = async (
  ticket: Ticket,
  flowConfig: any,
  step: any,
  stepCondition: any
): Promise<void> => {
  // action = 1: enviar para fila: queue
  if (stepCondition.action === 1) {
    ticket.update({
      queueId: stepCondition.queueId,
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    await CreateLogTicketService({
      ticketId: ticket.id,
      type: "queue",
      queueId: stepCondition.queueId
    });

    if (flowConfig?.configurations?.autoDistributeTickets) {
      await DefinedUserBotService(
        ticket,
        stepCondition.queueId,
        ticket.tenantId,
        flowConfig?.configurations?.autoDistributeTickets
      );
      ticket.reload();
    }

    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticket
    });
  }
};

const isUserDefine = async (
  ticket: Ticket,
  step: any,
  stepCondition: any
): Promise<void> => {
  // action = 2: enviar para determinado usuário
  if (stepCondition.action === 2) {
    ticket.update({
      userId: stepCondition.userIdDestination,
      // status: "pending",
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    ticket.reload();

    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticket
    });

    await CreateLogTicketService({
      userId: stepCondition.userIdDestination,
      ticketId: ticket.id,
      type: "userDefine"
    });
  }
};

// enviar mensagem de boas vindas à fila ou usuário
const sendWelcomeMessage = async (
  ticket: Ticket,
  flowConfig: any
): Promise<void> => {
  if (flowConfig?.configurations?.welcomeMessage?.message) {
    const messageData = {
      body: flowConfig.configurations?.welcomeMessage.message,
      fromMe: true,
      read: true,
      sendType: "bot"
    };

    await CreateMessageSystemService({
      msg: messageData,
      tenantId: ticket.tenantId,
      ticket,
      sendType: messageData.sendType,
      status: "pending"
    });
  }
};

const isRetriesLimit = async (
  ticket: Ticket,
  flowConfig: any
): Promise<boolean> => {
  // verificar o limite de retentativas e realizar ação
  const maxRetryNumber = flowConfig?.configurations?.maxRetryBotMessage?.number;
  if (
    flowConfig?.configurations?.maxRetryBotMessage &&
    maxRetryNumber &&
    ticket.botRetries >= maxRetryNumber - 1
  ) {
    const destinyType = flowConfig.configurations.maxRetryBotMessage.type;
    const { destiny } = flowConfig.configurations.maxRetryBotMessage;
    const updatedValues: any = {
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    };
    const logsRetry: any = {
      ticketId: ticket.id,
      type: destinyType === 1 ? "retriesLimitQueue" : "retriesLimitUserDefine"
    };

    // enviar para fila
    if (destinyType === 1 && destiny) {
      updatedValues.queueId = destiny;
      logsRetry.queueId = destiny;
    }
    // enviar para usuario
    if (destinyType === 2 && destiny) {
      updatedValues.userId = destiny;
      logsRetry.userId = destiny;
    }

    ticket.update(updatedValues);
    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticket
    });
    await CreateLogTicketService(logsRetry);

    // enviar mensagem de boas vindas à fila ou usuário
    await sendWelcomeMessage(ticket, flowConfig);
    return true;
  }
  return false;
};

const isAnswerCloseTicket = async (
  ticket: Ticket,
  step: any,
  stepCondition: any
): Promise<boolean> => {

  if (stepCondition.action === 3) {
    const tenantId = ticket.tenantId;
    const whatsapp = await Whatsapp.findOne({
      where: { id: ticket.whatsappId, tenantId }
    });
    if (whatsapp?.farewellMessage) {
      const body = pupa(whatsapp.farewellMessage || "", {
        protocol: ticket.protocol,
        name: ticket.contact.name
      });
    const messageData = {
      msg: { body, fromMe: true, read: true },
      tenantId,
      ticket,
      sendType: "bot",
      status: "pending",
      isTransfer: false,
      note: false
    };
    await CreateMessageSystemService(messageData);

    await ticket.update({
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date(),
      unreadMessages: 0,
      answered: true,
      status: "closed",
      isFarewellMessage: true
    });

    await CreateLogTicketService({
      ticketId: ticket.id,
      type: "autoClose"
    });

    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticket
    });

    return true;
  }
  }
  return false;
};



const isGetFaturaHubsoft = async (
  ticket: Ticket,
  step: any,
  stepCondition: any,
  msg: WbotMessage | any,
  chatFlow: any,
  flowConfig: any
): Promise<boolean> => {

  if (stepCondition.action === 4 || stepCondition.action === 5) { // a vencer
     try {
      var datainicio;
      var datafim;
      if(stepCondition.action == 4)
      {
      const today = new Date();
      const yyyyToday = today.getFullYear();
      const mmToday = String(today.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
      const ddToday = String(today.getDate()).padStart(2, '0');
       datainicio = `${yyyyToday}-${mmToday}-${ddToday}`;

      // Obter a data de 30 dias no futuro no formato YYYY-MM-DD
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);
      const yyyyFuture = futureDate.getFullYear();
      const mmFuture = String(futureDate.getMonth() + 1).padStart(2, '0');
      const ddFuture = String(futureDate.getDate()).padStart(2, '0');
      datafim = `${yyyyFuture}-${mmFuture}-${ddFuture}`;
      }else{// se for para boleto vencido
        // Obter a data de ontem
        const today = new Date();
        today.setDate(today.getDate() -1);
        const yyyyToday = today.getFullYear();   
        const mmToday = String(today.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
        const ddToday = String(today.getDate()).padStart(2, '0');
        datafim = `${yyyyToday}-${mmToday}-${ddToday}`;
  
        // Obter a data de 15 dias atras
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() -14);
        const yyyyFuture = futureDate.getFullYear();
        const mmFuture = String(futureDate.getMonth() + 1).padStart(2, '0');
        const ddFuture = String(futureDate.getDate()).padStart(2, '0');
        datainicio= `${yyyyFuture}-${mmFuture}-${ddFuture}`;
      }
      // Chama a função getFatura para obter as faturas do cliente
     const cliente = await getCliente(msg.body)
     
     if(cliente.clientes.length === 0){// cliente não encontrado
      
      const messageData = {
        body:
        "*Desculpe! Não conseguimos encontrar seu cadastro.*",
        fromMe: true,
        read: true,
        sendType: "bot"
      };

      await CreateMessageSystemService({
        msg: messageData,
        tenantId: ticket.tenantId,
        ticket,
        sendType: messageData.sendType,
        status: "pending"
      });



      verifyStep(ticket, step, stepCondition, msg, chatFlow, flowConfig, stepCondition.condition_f);
   
     } else {
     const faturas = await getFatura(msg.body, datainicio, datafim);

     const messageData = {
      body:
      "*Aguarde um instante!*",
      fromMe: true,
      read: true,
      sendType: "bot"
    };

    await CreateMessageSystemService({
      msg: messageData,
      tenantId: ticket.tenantId,
      ticket,
      sendType: messageData.sendType,
      status: "pending"
    });

   if(faturas.faturas.length === 0){
      
      const messageData = {
        body:
        "*Não conseguimos encontrar uma fatura em atraso com até 15 dias.*",
        fromMe: true,
        read: true,
        sendType: "bot"
      };

      await CreateMessageSystemService({
        msg: messageData,
        tenantId: ticket.tenantId,
        ticket,
        sendType: messageData.sendType,
        status: "pending"
      });


      verifyStep(ticket, step, stepCondition, msg, chatFlow, flowConfig, stepCondition.condition_f);
   }
    else{
    try{
    for (const [index, fatura] of faturas.faturas.entries()) {
      const { link } = fatura;
      if (link) {
        const fileName = `fatura_${ticket.id}-${index + 1}.pdf`;
          const download = new DownloaderHelper(link, 'public', { fileName: fileName });
    
          await new Promise((resolve, reject) => {
            download.on('end', async () => {
              console.log('Download Concluído');
              const messageData: MessageRequest = {
                type: "MediaField",
                data: {
                  ext: "pdf",
                  mediaUrl: fileName,
                  type: "application/pdf",
                  name: fileName,
                  caption: "Legenda opcional"
                },
                id: fileName
              };
              await BuildSendMessageService({
                msg: messageData,
                tenantId: ticket.tenantId,
                ticket
              });
              resolve('e');
            });
    
            download.on('error', (err) => {
              console.error('Erro durante o download:', err);
              reject(err);
            });
    
            download.start();
          });
        }
      }

      await isNextSteps(ticket, chatFlow, step, stepCondition.condition_v);

      // action = 1: enviar para fila: queue
      await isQueueDefine(ticket, flowConfig, step, stepCondition.condition_v);
  
      // action = 2: enviar para determinado usuário
      await isUserDefine(ticket, step, stepCondition.condition_v);
      
      //action = 3 : finalizar atendimento
    
    // Chama a função isAnswerCloseTicket()
     setTimeout(async () => {
      await isAnswerCloseTicket(ticket, step, stepCondition.condition_v);
    }, 15000);
  
      socketEmit({
        tenantId: ticket.tenantId,
        type: "ticket:update",
        payload: ticket
      });
  
      if (stepCondition.condition_v.action === 1 || stepCondition.condition_v.action === 2) {
        await sendWelcomeMessage(ticket, flowConfig);
      }
      }catch (error){
        verifyStep(ticket, step, stepCondition, msg, chatFlow, flowConfig, stepCondition.condition_f);
      }
    }
  }
  } catch (error) {
      console.error("Erro ao obter faturas:", error.message);
    }
    return true;
    }
    return false
  };




  const isDesbloqueioConfiancaHubsoft = async (
    ticket: Ticket,
    step: any,
    stepCondition: any,
    msg: WbotMessage | any,
    chatFlow: any,
    flowConfig: any
  ): Promise<void> => {
  
    if (stepCondition.action === 6) { // a vencer
      
    if(ticket.selectOption === false){
      const cliente = await getCliente(msg.body)
    try {
        // Chama a função getFatura para obter as faturas do cliente
       if(cliente?.clientes?.length === 0){// cliente não encontrado
        
        const messageData = {
          body:
          "*Desculpe! Não conseguimos encontrar seu cadastro.*",
          fromMe: true,
          read: true,
          sendType: "bot"
        };
  
        await CreateMessageSystemService({
          msg: messageData,
          tenantId: ticket.tenantId,
          ticket,
          sendType: messageData.sendType,
          status: "pending"
        });
  
  
        verifyStep(ticket, step, stepCondition, msg, chatFlow, flowConfig, stepCondition.condition_f);
     
       } else {
  
              const messageData = {
                body:
                "*Aguarde um instante!*",
                fromMe: true,
                read: true,
                sendType: "bot"
              };
          
              await CreateMessageSystemService({
                msg: messageData,
                tenantId: ticket.tenantId,
                ticket,
                sendType: messageData.sendType,
                status: "pending"
              });
  
     if(cliente.clientes[0].servicos.length === 0){
        
        const messageData = {
          body:
          "*Não conseguimos encontrar um serviço em seu cadastro.*",
          fromMe: true,
          read: true,
          sendType: "bot"
        };
  
        await CreateMessageSystemService({
          msg: messageData,
          tenantId: ticket.tenantId,
          ticket,
          sendType: messageData.sendType,
          status: "pending"
        });
  
  
  
        verifyStep(ticket, step, stepCondition, msg, chatFlow, flowConfig, stepCondition.condition_f);
       
     }
      else{
            var planos = '*Digite a opção para qual serviço deseja atendimento:* \n\n';
            for (const [index, servico] of cliente.clientes[0].servicos.entries()) {
              planos += `*Digite ${index+1}* para o serviço: ${servico.nome}\nStatus: ${servico.status}\nEndereço: ${servico.endereco_instalacao.endereco}\n\n`;
              }
        
        await ticket.update({
          cpfOption: msg.body,
          selectOption: true
        });

        const messageData = {
          body:
          planos,
          fromMe: true,
          read: true,
          sendType: "bot"
        };
    
        await CreateMessageSystemService({
          msg: messageData,
          tenantId: ticket.tenantId,
          ticket,
          sendType: messageData.sendType,
          status: "pending"
        });
    

      }
        }
    } catch (error) {
        console.error("Erro ao obter faturas:", error.message);
      }
    } else {
      try{
      const cliente = await getCliente(ticket.cpfOption);
      console.log('chegou aqui')
      const servico = await cliente.clientes[0].servicos[parseInt(msg.body)-1];
      if(servico.status === 'Serviço Habilitado'){
        const messageData = {
          body:
          "*Seu serviço já está habilitado.*",
          fromMe: true,
          read: true,
          sendType: "bot"
        };
  
        await CreateMessageSystemService({
          msg: messageData,
          tenantId: ticket.tenantId,
          ticket,
          sendType: messageData.sendType,
          status: "pending"
        });
         verifyStep(ticket, step, stepCondition, msg, chatFlow, flowConfig, stepCondition.condition_f);
          // action = 0: enviar para proximo step: nextStepId
      }else {
     
            const result  = await desbloqueioConfianca(servico.id_cliente_servico)
            await ticket.update({
              selectOption: false
            });
            const messageData = {
              body:
              result.msg,
              fromMe: true,
              read: true,
              sendType: "bot"
            };
      
            await CreateMessageSystemService({
              msg: messageData,
              tenantId: ticket.tenantId,
              ticket,
              sendType: messageData.sendType,
              status: "pending"
            });
        

            await isNextSteps(ticket, chatFlow, step, stepCondition.condition_v);

            // action = 1: enviar para fila: queue
            await isQueueDefine(ticket, flowConfig, step, stepCondition.condition_v);
        
            // action = 2: enviar para determinado usuário
            await isUserDefine(ticket, step, stepCondition.condition_v);
            
            //action = 3 : finalizar atendimento
          
          // Chama a função isAnswerCloseTicket()
          setTimeout(async () => {
            await isAnswerCloseTicket(ticket, step, stepCondition.condition_v);
          }, 15000);
        
            socketEmit({
              tenantId: ticket.tenantId,
              type: "ticket:update",
              payload: ticket
            });
        
            if (stepCondition.condition_v.action === 1 || stepCondition.condition_v.action === 2) {
              await sendWelcomeMessage(ticket, flowConfig);
            }
      }
    }catch(error){
      verifyStep(ticket, step, stepCondition, msg, chatFlow, flowConfig, stepCondition.condition_f);
    }
    }
    }

    };
  
    const verifyStep= async (
      ticket: Ticket,
      step: any,
      stepCondition: any,
      msg: WbotMessage | any,
      chatFlow: any,
      flowConfig: any,
      condition: any
    ): Promise<void> => {

      await isNextSteps(ticket, chatFlow, step, condition);
  
      // action = 1: enviar para fila: queue
      await isQueueDefine(ticket, flowConfig, step, condition);

      // action = 2: enviar para determinado usuário
      await isUserDefine(ticket, step, condition);
      
      //action = 3 : finalizar atendimento
      await isAnswerCloseTicket(ticket, step, condition);
      socketEmit({
        tenantId: ticket.tenantId,
        type: "ticket:update",
        payload: ticket
      });

      if (stepCondition.condition_f.action === 1 || stepCondition.condition_f.action === 2) {
        await sendWelcomeMessage(ticket, flowConfig);
      }
    }
 
const VerifyStepsChatFlowTicket = async (
  msg: WbotMessage | any,
  ticket: Ticket | any
): Promise<void> => {
  let celularTeste; // ticket.chatFlow?.celularTeste;

  if (
    ticket.chatFlowId &&
    ticket.status === "pending" &&
    !msg.fromMe &&
    !ticket.isGroup &&
    !ticket.answered
  ) {
    if (ticket.chatFlowId) {
      const chatFlow = await ticket.getChatFlow();
      if (chatFlow.celularTeste) {
        celularTeste = chatFlow.celularTeste.replace(/\s/g, ""); // retirar espaços
      }

      const step = chatFlow.flow.nodeList.find(
        (node: any) => node.id === ticket.stepChatFlow
      );

      const flowConfig = chatFlow.flow.nodeList.find(
        (node: any) => node.type === "configurations"
      );

      // verificar condição com a ação do step
      const stepCondition = step.conditions.find((conditions: any) => {
        if (conditions.type === "US") return true;
        const newConditions = conditions.condition.map((c: any) =>
          String(c).toLowerCase().trim()
        );
        const message = String(msg.body).toLowerCase().trim();
        return newConditions.includes(message);
      });



      if (stepCondition && !ticket.isCreated) {
        // await CreateAutoReplyLogsService(stepAutoReplyAtual, ticket, msg.body);
        // Verificar se rotina em teste
        if (
          await IsContactTest(
            ticket.contact.number,
            celularTeste,
            ticket.channel
          )
        )
          return;

        // action = 0: enviar para proximo step: nextStepId
        await isNextSteps(ticket, chatFlow, step, stepCondition);

        // action = 1: enviar para fila: queue
        await isQueueDefine(ticket, flowConfig, step, stepCondition);

        // action = 2: enviar para determinado usuário
        await isUserDefine(ticket, step, stepCondition);
        
        //action = 3 : finalizar atendimento
        await isAnswerCloseTicket(ticket, step, stepCondition);
        
      
        //action = 4 ou 5 pegar as faturas do cliente
        await isGetFaturaHubsoft(ticket, step, stepCondition, msg, chatFlow, flowConfig);

        await isDesbloqueioConfiancaHubsoft(ticket, step, stepCondition, msg, chatFlow, flowConfig);

        socketEmit({
          tenantId: ticket.tenantId,
          type: "ticket:update",
          payload: ticket
        });

        if (stepCondition.action === 1 || stepCondition.action === 2) {
          await sendWelcomeMessage(ticket, flowConfig);
        }
      } else {
        // Verificar se rotina em teste
        if (
          await IsContactTest(
            ticket.contact.number,
            celularTeste,
            ticket.channel
          )
        )
          return;

        // se ticket tiver sido criado, ingnorar na primeria passagem
        if (!ticket.isCreated) {
          if (await isRetriesLimit(ticket, flowConfig)) return;

          const messageData = {
            body:
              flowConfig.configurations.notOptionsSelectMessage.message ||
              "Desculpe! Não entendi sua resposta. Vamos tentar novamente! Escolha uma opção válida.",
            fromMe: true,
            read: true,
            sendType: "bot"
          };

          await CreateMessageSystemService({
            msg: messageData,
            tenantId: ticket.tenantId,
            ticket,
            sendType: messageData.sendType,
            status: "pending"
          });

          // tratar o número de retentativas do bot
          await ticket.update({
            botRetries: ticket.botRetries + 1,
            lastInteractionBot: new Date()
          });
        }
        for (const interaction of step.interactions) {
          await BuildSendMessageService({
            msg: interaction,
            tenantId: ticket.tenantId,
            ticket
          });
        }
      }
      // await SetTicketMessagesAsRead(ticket);
      // await SetTicketMessagesAsRead(ticket);
    }
  }
};


export default VerifyStepsChatFlowTicket;
