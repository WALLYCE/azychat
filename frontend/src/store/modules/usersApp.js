
const usersApp = {
  state: {
    usersApp: []
  },
  mutations: {
    SET_USERS_APP (state, payload) {
      console.log('atualizou')
      state.usersApp = payload
    }
  }

}

export default usersApp
