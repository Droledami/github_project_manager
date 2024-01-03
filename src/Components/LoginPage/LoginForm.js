import {useState} from "react";

export default function LoginForm() {

    const [inputUsername, setInputUsername] = useState(null);
    const [inputPassword, setInputPassword] = useState(null);

    return (
        <form>
            <input type="text" name="username" value={inputUsername}
                   onChange={(e)=> {setInputUsername(e.target.value) }
            }/>
            <input type="text" name="password" value={inputPassword}
                   onChange={(e)=> {setInputPassword(e.target.value) }
            }/>
            <button type="submit">
                Connexion
            </button>
        </form>
    );
}