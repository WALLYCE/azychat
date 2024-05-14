<template>
  <div>
    <q-btn
      class="drag-button"
      fab
      color="primary"
      icon="chat"
      @click="openModal"
      :style="{ bottom: position.bottom, right: position.right, position: 'fixed', 'z-index': 9999 }"
    />
    <q-dialog v-model="showModal" transition-show="rotate" transition-hide="rotate">
      <q-card style="width: 700px; max-width: 80vw; height: 70vh; overflow-y: hidden;">
        <cContacts v-if="contatos" @informacao="receberInformacaoContatos"/>
        <cChat v-if="chat" @informacao="receberInformacaoChat"/>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import cContacts from './cContacts.vue';
import cChat from './cChat.vue';
import { socketIO } from 'src/utils/socket';
const socket = socketIO()

export default {
  name: 'FloatingChatIcon',
  components: { cContacts, cChat },
  data() {
    return {
      position: { bottom: '50px', right: '50px' },
      showModal: false,
      contatos: true,
      chat: false,
      usuario: {}
    };
  },
  methods: {
    openModal() {
      console.log("Abrindo modal...");
      this.showModal = !this.showModal;
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

    },
    usersOnline(){
      this.socket.on('connect', () => {
        this.socket.emit('updateUsers');
      });
    },
     conectarSocket () {
      console.log(this.usuario.tenantId)
      this.usuario = JSON.parse(localStorage.getItem('usuario'))
      console.log(this.usuario)
      socket.on('connect', ()=> {
        socket.emit('Im-Online', this.usuario.userId)
        socket.on(`updateUsersOnline`, data => {
          console.log(data);
        //this.$store.commit('SET_USERS_APP', data)
      })
      })
 
    },
  },
  async mounted() {
    this.usuario = await JSON.parse(localStorage.getItem('usuario'));
    await this.conectarSocket(this.usuario);
  },
  watch: {
    '$store.state.usersApp': function (newValue, oldValue) {
      console.log(newValue);
    }
  },
  destroyed () {
    socket.emit(`${this.usuario.tenantId}:setUserIdle`);
    socket.disconnect()
  }
}
</script>

<style scoped>
.drag-button {
  cursor: pointer;
}
</style>

</script>

<style scoped>
.drag-button {
  cursor: pointer;
}
</style>



</script>

<style scoped>
.drag-button {
  cursor: pointer;
}
</style>
