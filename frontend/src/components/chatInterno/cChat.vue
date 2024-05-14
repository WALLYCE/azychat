<template>
       
      <q-layout view="lHh lpr lFf" container style="height: 70vh; margin-bottom: 10px;" class="shadow-2 rounded-borders">
        <q-header elevated>
          <q-toolbar class="bg-primary text-white shadow-2">
            <q-btn @click="voltar" flat dense round icon="arrow_back" class="text-white" />
            <q-toolbar-title>Conversa</q-toolbar-title>
          </q-toolbar>
        </q-header>
                   
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
         
        <q-page class="flex column" >
            <div class="q-pa-md column col justify-end" >
                
                <q-chat-message
                    v-for="message in messages"
                    :key="message.id"
                    :name="message.from"
                    :text="[message.text]"
                    :sent="message.from == 'Eu'? true : false"
                />
              
            </div>
        </q-page>
      </q-layout>

  </template>
  
  <script>
  export default {
    name: "cChat",
    data(){
        return{
            newMessage: '',
            messages: [{
                id: 0,
                text: 'Opa tudo bem',
                from: 'Eu',
            },
            {
                id: 1,
                text: 'Bem e você?',
                from: 'Joao',
            },
            {
                id: 2,
                text: 'Bem também',
                from: 'Eu',
            },
            {
                id: 3,
                text: 'Que bom!',
                from: 'Joao',
            }]
        }


    },
    methods: {
      voltar() {
        this.$emit('informacao', { chat: false, contatos: true });
      },
      sendMessage(event) {
    // Evita o comportamento padrão de submissão do formulário
            event.preventDefault();
            this.messages.push({
                id: Math.floor(Math.random() * 100) + 1,
                text: this.newMessage,
                from: 'Eu'
            })

            // Limpa o campo de mensagem após o envio
            this.newMessage = '';
  }

    }
  }
  </script>
  
  <style scoped>


  </style>
  