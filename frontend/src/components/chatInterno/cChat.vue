<template>
  
  <q-layout view="lHh lpr lFf" container style="height: 70vh" class="shadow-2 rounded-borders flex ">
  <q-header style="height: 50px;">
    <q-toolbar class="bg-primary text-white shadow-2" style="height: max-content;">
      <div class="flex items-center" style="height: max-content;"> 
        <q-btn @click="voltar" flat dense round icon="arrow_back" class="text-white" />
        <div class="flex-grow-1">
          <q-toolbar-title class="text-center">
            {{ $store.state.chatInterno.chatAberto.name }}
          </q-toolbar-title>
        </div>
      </div>
    </q-toolbar>
  </q-header>
  <div style="overflow-y: scroll; height: calc(70vh - 110px); margin-top: 50px; margin-bottom: 60px;" ref="messagesContainer">
        <q-page class="flex column">
            <div class="q-pa-md column col justify-end" ref="messagesContainer" >
                
                <q-chat-message 
                 
                    v-for="message in mensagensDoChatAberto"
                    :key="message.id"
                    :name="message.from == 'Eu'? 'Eu':usuarioConversa"
                    :text="[message.text]"
                    :sent="message.from == 'Eu'? true : false"
                />
              
            </div>
        </q-page>
        </div>
 <q-footer elevated class="bg-white q-pb-sm q-pt-sm">
          <q-toolbar>
            <q-form @submit="sendMessage" style="min-width: 100%;">
        <q-input v-model="newMessage" outlined label="Mensagem" style="min-width: 100%;" rounded>
        <template v-slot:append>
            <q-btn flat icon="send" @click="sendMessage" />
        </template>
      </q-input>
    </q-form>
          </q-toolbar>
</q-footer>


</q-layout>

  </template>
  
  <script>
  import { mapState } from 'vuex';
 import messageFieldVue from '../ccFlowBuilder/messageField.vue';
  export default {
    
    name: "cChat",
    data(){
        return{
            newMessage: '',
        }


    },
    methods: {
      voltar() {
        this.$store.dispatch('chatFechado')
        this.$emit('informacao', { chat: false, contatos: true });
      },
      sendMessage(event) {
    // Evita o comportamento padrão de submissão do formulário
            event.preventDefault();
            if(this.newMessage.trim() !== ''){
            this.$store.dispatch('sendMessageFirebase', {text: this.newMessage})
            }
            this.newMessage = '';
    },
    scrollToBottom() {
    // Obtenha a referência do elemento que contém as mensagens
    const messagesContainer = this.$refs.messagesContainer;
    // Atribua a altura da div ao scrollTop para rolar para o final
    console.log('altura do container', messagesContainer.scrollHeight)
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
   
  }


    },
    computed: {
    // Mapeia o estado 'chatAberto' para a propriedade computada 'mensagensDoChatAberto' do componente
    ...mapState({
      // Calcula as mensagens do chat aberto com base no userIdOpenChat
      mensagensDoChatAberto() {
        // 'this' refere-se à instância Vue atual
        const userIdOpenChat = this.userIdOpenChat;
        const chats = this.$store.state.chatInterno.myChats[userIdOpenChat];
        if (chats && chats.chats) {
            return chats.chats;
        } else {
            return {};
        }
      
      },
      // Obtém o userId do chat aberto do estado Vuex
      userIdOpenChat: state => state.chatInterno.chatAberto.userId,
      usuarioConversa : state => state.chatInterno.chatAberto.name
    })


    
  },
  watch: {
  // Assista às mudanças na lista de mensagens
  mensagensDoChatAberto() {
    // Use nextTick para garantir que a atualização do DOM seja concluída
    this.$nextTick(() => {
      // Chame o método scrollToBottom para rolar a lista de mensagens para o final
      this.scrollToBottom();
    });
  }

  
},
mounted(){
  this.scrollToBottom();
  
}
  }
  </script>
  
  <style scoped>


  </style>
  