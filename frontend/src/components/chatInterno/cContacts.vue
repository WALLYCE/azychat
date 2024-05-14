<template>
    <div style="max-width: '100%'">
      <q-toolbar class="bg-primary text-white shadow-2">
        <q-toolbar-title>Chat Interno</q-toolbar-title>
      </q-toolbar>
      <div class="contact-list"  style="max-height: 70vh; overflow-y: auto;">
      <q-list bordered>
        <q-item v-for="user in users.filter(u => u.online == true)" 
            :key="user.id"
             class="q-my-sm"
              clickable
              @click="abrirChat(user.id)"
              v-ripple>
          <q-item-section avatar >
            <q-avatar color="primary" text-color="white">
              {{ user.name.charAt(0) }}
            </q-avatar>
          </q-item-section>
  
          <q-item-section>
            <q-item-label>{{ user.name }}</q-item-label>
          </q-item-section>
  
          <q-item-section side>
            <q-badge name="chat_bubble" color="green">Online</q-badge>
          </q-item-section>
        </q-item>
  
        <q-separator />
        <q-item-label header>Offline</q-item-label>
  
        <q-item v-for="user in  users.filter(u => u.online == false)" :key="user.id" class="q-mb-sm" clickable v-ripple>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              {{ user.name.charAt(0) }}
            </q-avatar>
          </q-item-section>
  
          <q-item-section>
            <q-item-label>{{ user.name }}</q-item-label>
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


export default {
  name: 'cContacts',
  data() {
    return {
      users: [
        { id: 1, name: 'Ruddy Jedrzej', online: true },
        { id: 2, name: 'Mallorie Alessandrini', online: true },
        { id: 3, name: 'Elisabetta Wicklen', online: true },
        { id: 4, name: 'Seka Fawdrey', online: true },
        { id: 5, name: 'Brunhilde Panswick', online: false },
        { id: 6, name: 'Winfield Stapforth', online: false },
        { id: 7, name: 'Winfield Stapforth', online: false },
        { id: 8, name: 'Winfield Stapforth', online: false },
        { id: 9, name: 'Winfield Stapforth', online: false },
        { id: 10, name: 'Winfield Stapforth', online: false }
      ]
    };
  },
  methods: {
    abrirChat(userId) {
      this.$emit('informacao', { destino: userId, chat: true, contatos: false });
    }
  }
};
  
  </script>
  