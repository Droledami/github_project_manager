import {Form} from "react-router-dom";
import {useState} from "react";
import {useUser} from "../../customHooks";

export default function LoginForm() {

    const user = useUser();

    const [inputUsername, setInputUsername] = useState(null);
    const [inputPassword, setInputPassword] = useState(null);

    return (
        <Form>
            <p className="input-label">Nom d'utilisateur</p>
            <input type="text" name="username" value={inputUsername}
                   onChange={(e)=> {setInputUsername(e.target.value) }
            }/>
            <p className="input-label">Mot de passe</p>
            <input type="password" name="password" value={inputPassword}
                   onChange={(e)=> {setInputPassword(e.target.value) }
            }/>
            <button type="submit" onClick={() => {user.connectFunction(inputUsername, inputPassword).then(() => window.location.reload());}}>
                Connexion
            </button>
        </Form>
    );
}