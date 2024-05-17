import { ref, onValue, onChildAdded, onChildChanged, set, onDisconnect, get, push, update  } from "firebase/database";
import { fireBaseDB } from "src/boot/firebase";
import som from 'src/assets/sound.mp3';
const chatInterno = {
  state: {
    userId: "",
    name: "",
    email: "", // substitua por seu próprio userId
    online: false,
    usersOnline: {},
    usersOffline: {},
    myChats: {},
    chatAberto: {userId: '', name: ''},
    notificacoes: {}
  },
  actions: {
    registerUserChatInterno({}, formData) {
      set(ref(fireBaseDB, "users/" + formData.id), {
        email: formData.email,
        name: formData.name,
        online: false,
      });
    },
    chatAberto({commit}, user){
        commit("setChatAberto", user);
    },
   async chatFechado({commit, state}){
      const chatIdFilho = state.chatAberto.userId;
       const  notificationData = {status: 0}
       commit('addNotificacoes', {chatIdFilho, notificationData });
        const userNotificationRefHim = ref(fireBaseDB, `chats/${state.userId}/${chatIdFilho}/notification/`);
        set(userNotificationRefHim, { status: 0 })
        .then(() => {
          console.log("Status da notificação atualizado/criado com sucesso no Firebase.");
          

        })
        .catch((error) => {
          console.error("Erro ao atualizar/criar o status da notificação no Firebase:", error);
        });

    

    },

    setUserChat({ dispatch, commit }, user) {
      commit('setUser', user)
      dispatch("getUsersFirebase");
      const userStatusRef = ref(
        fireBaseDB,
        `users/${user.userId}/online`
      );
      const isOnline = true;

      set(userStatusRef, isOnline)
        .then(() => {
          console.log(`Status do usuário ${user.userId} definido como online.`);
        })
        .catch((error) => {
          console.error(
            "Erro ao definir status do usuário como online:",
            error
          );
        });

      const onDisconnectRef = onDisconnect(userStatusRef);
      onDisconnectRef
        .set(false)
        .then(() => {
          console.log(
            `Ação definida para atualizar status do usuário ${user.userId} para offline quando desconectado.`
          );
        })
        .catch((error) => {
          console.error(
            "Erro ao definir ação para atualizar status do usuário para offline:",
            error
          );
        });

       
    },

getUsersFirebase({ commit, state }) {
      const usersChat = ref(fireBaseDB, `users`);
      onValue(usersChat, (snapshot) => {
        const data = snapshot.val();
        var usuariosOnline = {};
        var usuariosOffline = [];

        for (const userId in data) {
          const user = data[userId];
          if (userId !== state.userId) {
            if (user.online) {
              usuariosOnline =
              {...usuariosOnline,
                [userId]: { 
                userId: userId,
                  ...user }};
            } else {
              usuariosOffline =
              {...usuariosOffline,
                userId: { 
                userId: userId,
                ...user }};
            }
          }
        }
        commit("setUsersOnline", usuariosOnline);
        commit("setUsersOffline", usuariosOffline);
      });
    },
 
    
    sendMessageFirebase({ state }, data) {
        
        const userChatsRefMe = ref(fireBaseDB, `chats/${state.userId}/${state.chatAberto.userId}/chats/`);
        const userChatsRefHim = ref(fireBaseDB, `chats/${state.chatAberto.userId}/${state.userId}/chats/`);
        const userNotificationRefHim = ref(fireBaseDB, `chats/${state.chatAberto.userId}/${state.userId}/notification/`);
        const messageMe = {
            "text": data.text,
            "from": "Eu",
        };
        const messageHim = {
            "text": data.text,
            "from": "Ele",
        };

    
        push(userChatsRefMe, messageMe)
            .then(() => {
                console.log("Nova mensagem adicionada com sucesso ao Firebase.");
            })
            .catch((error) => {
                console.error("Erro ao adicionar nova mensagem ao Firebase:", error);
            });
        
        push(userChatsRefHim, messageHim)
            .then(() => {
                console.log("Nova mensagem adicionada com sucesso ao Firebase.");
            })
            .catch((error) => {
                console.error("Erro ao adicionar nova mensagem ao Firebase:", error);
            });

              get(userNotificationRefHim)
              .then(snapshot => {
                let currentStatus = snapshot.val() ? snapshot.val().status : 0;
                const statusUpdate = { "status": currentStatus + 1 };
                return update(userNotificationRefHim, statusUpdate);
              })
              .then(() => {
                console.log("Status da notificação atualizado com sucesso no Firebase.");
              })
              .catch((error) => {
                console.error("Erro ao atualizar o status da notificação no Firebase:", error);
              });
    }
    ,
    getMessagesFirebase({ commit, state }) {
      const userChatsRef = ref(fireBaseDB, `chats/${state.userId}`);
    
      // Adiciona um ouvinte para os chats do usuário
      onChildAdded(userChatsRef, chatSnapshot => {
        const chatIdFilho = chatSnapshot.key;
        const userNotificationRefFilho = ref(fireBaseDB, `chats/${state.userId}/${chatIdFilho}/notification/`);
        get(userNotificationRefFilho).then(snapshot => {
          snapshot.forEach(notificationSnapshot => {
            const notificationData = notificationSnapshot.val();
            console.log('todas notificacoes', notificationData)
            if(notificationData.status !=null){
            commit('addNotificacoes', {chatIdFilho, notificationData });
            }
            // Lógica para lidar com a notificação existente
          });
        }).catch(error => {
          console.error("Erro ao recuperar as notificações existentes:", error);
        });

        onValue(userNotificationRefFilho, notificationSnapshot => {
          const notificationData = notificationSnapshot.val();
            if(notificationData.status!=null){
            console.log('notificacao pegada', chatIdFilho, ' - ',notificationData)
            commit('addNotificacoes', {chatIdFilho, notificationData });
            }
          // Lógica para lidar com a notificação adicionada ou alterada
        });
  
        // Verifica se o chat filho já foi adicionado anteriormente
        if (!state.myChats[chatIdFilho]) {
          // Obtemos uma referência para os chats do filho atual
          const userChatRefFilho = ref(fireBaseDB, `chats/${state.userId}/${chatIdFilho}/chats/`);
          const userNotificationRefFilho = ref(fireBaseDB, `chats/${state.userId}/${chatIdFilho}/notification/`);
          
          // Adiciona um ouvinte para os chats do filho
          onChildAdded(userChatRefFilho, snapShotNeto => {
            const chatIdNeto = snapShotNeto.key;
            const chatData = snapShotNeto.val();
            
            commit('addChatNeto', { chatFilho: chatIdFilho, chatNeto: chatIdNeto, chatData });
          });
    
          // Adiciona um ouvinte para as notificações do filho

          // Obtém todas as notificações do filho
 
        }
      });
    }
    
    
  ,
  },

  mutations: {
    setUser(state, user){
        state.userId = user.userId;
        state.name = user.name;
        state.email = user.email;
    },
    setUsersOnline(state, usersOnline) {
      state.usersOnline = usersOnline;
    },
    setUsersOffline(state, usersOffline) {
      state.usersOffline = usersOffline;
    },
    setChatAberto(state, user){
        state.chatAberto = {
            userId: user.userId,
            name: user.name,
        };

    },
    addChat(state, { chatID, chatData }) {
        // Verifica se o chat aberto corresponde ao chat que está sendo adicionado
        console.log('carregando chats inicialmente')
        // Atualiza o myChats com o novo chat
        
        state.myChats = { ...state.myChats, [chatID]: chatData };
    }
    ,
    updateChat(state, { chatID, chatData }) {

      state.myChats = { ...state.myChats, [chatID]: chatData };
      console.log('filho atualizado', chatData )

    },
    addChatNeto(state, { chatFilho, chatNeto, chatData }) {
      // Verifica se o chatFilho já existe no estado
      const existingChatFilho = state.myChats[chatFilho];
    
      if (existingChatFilho) {
        // Se o chatFilho já existir, adicione o novo neto a ele
        state.myChats = {
          ...state.myChats,
          [chatFilho]: {
            ...existingChatFilho,
            chats: {
              ...existingChatFilho.chats,
              [chatNeto]: chatData
            }
          }
        };
      } else {
        // Se o chatFilho não existir, crie-o com o novo neto
        state.myChats = {
          ...state.myChats,
          [chatFilho]: {
            chats: {
              [chatNeto]: chatData
            }
          }
        };
      }

   
    },

    addNotificacoes(state, {chatIdFilho, notificationData }) {
     
      state.notificacoes = { ...state.notificacoes, [chatIdFilho]: notificationData.status};
      if(notificationData.status > 0){
        // Reproduza o som
        const audio = new Audio(som);
        // Reproduza o som
        audio.play();

      
      
    }
      //console.log('notificações atualizadas', state.notificacoes)
    }
    
  },
  
};

export default chatInterno;
