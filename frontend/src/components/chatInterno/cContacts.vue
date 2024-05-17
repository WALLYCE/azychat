<template>
    <div style="max-width: '100%'">
      <q-toolbar class="bg-primary text-white shadow-2">
        <q-toolbar-title>Chat Interno</q-toolbar-title>
      </q-toolbar>
      <div class="contact-list"  style="max-height: 70vh; overflow-y: auto;">
      <q-list bordered>
        <q-item v-for="user in onlineUsers" 
            :key="user.userId"
             class="q-my-sm"
              clickable
              @click="abrirChat(user.userId, user.name)"
              v-ripple>
          <q-item-section avatar >
            <q-avatar color="primary" text-color="white">
              {{ user.name.charAt(0) }}
            </q-avatar>
          </q-item-section>
  
          <q-item-section>
            <q-item-label>{{ user.name }}</q-item-label>
          </q-item-section>
          <q-item-section side v-if="notificacoes[user.userId]  && notificacoes[user.userId] > 0">
            <q-badge rounded color="red" class="notification-badge" :label="notificacoes[user.userId]" />
        </q-item-section>
          <q-item-section side>
            <q-badge name="chat_bubble" color="green">Online</q-badge>
          </q-item-section>
        </q-item>
  
        <q-separator />
        <q-item-label header>Offline</q-item-label>
  
        <q-item v-for="user in offlineUsers"
         :key="user.userId" class="q-mb-sm" clickable v-ripple @click="abrirChat(user.userId, user.name)">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              {{ user.name.charAt(0) }}
            </q-avatar>
          </q-item-section>
  
          <q-item-section>
            <q-item-label>{{ user.name }}</q-item-label>
          </q-item-section>

          <q-item-section class="animate-ping" side v-if="notificacoes[user.userId]  && notificacoes[user.userId]> 0">
          <q-badge rounded color="red"  class="notification-badge" :label="notificacoes[user.userId]" />
            </q-item-section>
          <q-item-section side>
            <q-badge name="chat_bubble" color="grey">Offline</q-badge>
          </q-item-section>
        </q-item>
      </q-list>
      </div>
    </div>
  </template>
  
  <script>

import { mapState } from 'vuex';
export default {
  name: 'cContacts',
  data() {
    return {
  
    };
  },
  methods: {
    abrirChat(userId, name) {
      this.$emit('informacao', {chat: true, contatos: false });
      this.$store.dispatch('chatAberto', {userId: userId, name: name})
      
    }
  },
  computed: {
    ...mapState({
      onlineUsers: state => {
    const myUserId = state.chatInterno.userId;
    const usersOnline = { ...state.chatInterno.usersOnline }; // Cria uma cópia do objeto

    // Remove o usuário com o mesmo ID que myUserId
    delete usersOnline[myUserId];

    return usersOnline;
},
      offlineUsers: state => state.chatInterno.usersOffline,
      meusChats: state => state.chatInterno.myChats,
      notificacoes: state => state.chatInterno.notificacoes
   
    })
  },
};
  
  </script>
  <style scoped>
  .notification-badge {
    animation: pulse 1s infinite; /* Aplica a animação 'pulse' com duração de 1 segundo e repetição infinita */
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
  