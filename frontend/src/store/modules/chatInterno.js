import {fireBaseDB, fireBaseAuth} from "src/boot/firebase";
import {ref, set, update} from "firebase/database"

const chatInterno = {
    
    actions:  {
        registerUserChatInterno({}, formData){
    
                    set(ref(fireBaseDB, 'users/' + formData.id), {
                        email: formData.email,
                        name: formData.name,
                        online: false
                      });
                
        },

    }
}

export default chatInterno;