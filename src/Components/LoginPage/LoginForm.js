import {Form} from "react-router-dom";
import {useState} from "react";
import {useUser} from "../../customHooks";

export default function LoginForm() {

    const user = useUser();

    const [inputUsername, setInputUsername] = useState(null);
    const [inputPassword, setInputPassword] = useState(null);

    return (
        <Form>
            <input type="text" name="username" value={inputUsername}
                   onChange={(e)=> {setInputUsername(e.target.value) }
            }/>
            <input type="text" name="password" value={inputPassword}
                   onChange={(e)=> {setInputPassword(e.target.value) }
            }/>
            <button type="submit" onClick={() => {user.connectFunction(inputUsername, inputPassword).then(() => window.location.reload());}}>
                Connexion
            </button>
        </Form>
    );
}