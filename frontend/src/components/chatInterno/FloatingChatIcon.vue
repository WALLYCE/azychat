<template>

  <div style="overflow-y: hidden">
    <q-btn
      :class="notificationClass"
      fab
      :color="colorbuttom"
      icon="chat"
      :label="labelChat"
      @click="openModal"
      :style="{ bottom: position.bottom, right: position.right, position: 'fixed', 'z-index': 9999}"
    />
 
    
    <q-dialog v-model="showModal" transition-show="rotate" transition-hide="rotate" style="overflow-y: hidden">
      <q-card style="width: 700px; max-width: 80vw; height: 70vh; overflow:hidden">
        <cContacts v-if="contatos" @informacao="receberInformacaoContatos" />
        <cChat v-if="chat" @informacao="receberInformacaoChat" style="overflow-y: hidden"/>
      </q-card>
    </q-dialog>
  </div>

</template>

<script>
import cContacts from './cContacts.vue';
import cChat from './cChat.vue';
import alertSound from 'src/assets/sound.mp3'


export default {
  name: 'FloatingChatIcon',
  components: { cContacts, cChat, alertSound },
  data() {
    return {
      position: { bottom: '50px', right: '50px' },
      showModal: false,
      contatos: true,
      chat: false,
      usuario: {},
      habilitarChat: false
    };
  },
  methods: {
    openModal() {
      if(this.habilitarChat == true){
      this.showModal = !this.showModal;
      }else{
        this.$store.dispatch('getMessagesFirebase');
        this.habilitarChat = true;
      }
    },
    closeModal() {
      
      this.showModal = false;
    },
    receberInformacaoContatos(dados){
   
      this.chat = dados.chat;
      this.contatos = dados.contatos;
    },
    receberInformacaoChat(dados){
      this.chat = dados.chat;
      this.contatos = dados.contatos;
    },
    atualizarUsuario(){
      this.usuario = JSON.parse(localStorage.getItem('usuario'));
       this.$store.dispatch('setUserChat', this.usuario);
    }
    

    

    
  },
  watch: {
    showModal(newValue, oldValue) {
      if (newValue == false) {
        this.$store.dispatch('chatFechado');
        this.chat = false;
        this.contatos = true;
      }
    }
  },
  mounted () {
  this.atualizarUsuario();

  },
  beforeDestroy() {
    // Remova o ouvinte de evento

  },
  computed: {
    temNotificacoes() {
      return Object.values(this.$store.state.chatInterno.notificacoes).some(valor => valor > 0);

    },
    notificationClass() {
      // Retorna a classe com base no resultado de 'temNotificacoes'
      return this.temNotificacoes ? 'notification-badge' : 'primary';
    },
     colorbuttom() {
      // Retorna a classe com base no resultado de 'temNotificacoes'
      if(this.habilitarChat == false){
        return 'black';
      }else{
      return this.temNotificacoes ? 'red' : 'primary';
      }
    },
    Label() {
      // Retorna a classe com base no resultado de 'temNotificacoes'
      return this.temNotificacoes ? 'red' : 'primary';
    },
    labelChat(){
      return this.habilitarChat? "Chat Habilitado":"Clique para Habilitar o Chat";
    }
  }
};

</script>

<style scoped>
.drag-button {
  cursor: pointer;
}

.notification-badge {
    animation: pulse 1s infinite;
    background-color: red; /* Aplica a animação 'pulse' com duração de 1 segundo e repetição infinita */
}

@keyframes pulse {
    0% {
        transform: scale(0.9); /* Diminui o tamanho inicialmente */
        opacity: 0.7; /* Opacidade inicial */
    }
    50% {
        transform: scale(1); /* Retorna ao tamanho normal no meio da animação */
        opacity: 1; /* Opacidade máxima */
    }
    100% {
        transform: scale(0.9); /* Diminui o tamanho novamente no final da animação */
        opacity: 0.7; /* Opacidade volta ao valor inicial */
    }
}
</style>



