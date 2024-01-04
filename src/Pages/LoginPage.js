import LoginForm from "../Components/LoginPage/LoginForm";
import {checkIfSessionExists} from "../userFunctions";
import {redirect} from "react-router";

export function loader(){
    if(checkIfSessionExists())
        return redirect("/");
    return null;
}

export default function LoginPage(){
    return(
      <LoginForm>

      </LoginForm>
    );
}