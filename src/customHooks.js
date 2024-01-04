import React, {createContext, useContext, useReducer} from "react";
import {login} from "./userFunctions";

/**Start of session management and useUser**/
const UserContext = createContext(null);

const guestUser = {teacher_id: undefined, token: undefined, refresh_token: undefined}

function setSession(tokens){
    console.log(tokens);
    localStorage.setItem('token',JSON.stringify(tokens));
}

function getSession(){
    const sessionString = localStorage.getItem('token');
    if(!sessionString) return guestUser;
    const session = JSON.parse(sessionString);
    return session;
}

function clearSession(){
    localStorage.removeItem('token');
}

export function UserProvider({children}){

    const initialUser = getSession();
    const [user, dispatch] = useReducer(userReducer, initialUser);

    function userReducer(user, action){
        switch (action.type){
            case "user_clicks_connect":
                setSession({...action.session_info})
                return {...user, ...action.session_info};
            case "user_clicks_disconnect":
                clearSession();
                return guestUser;
            default:
                return user;
        }
    }

    async function handleConnectFunc(newUsernameValue, newPasswordValue){
        dispatch({
            type:"user_clicks_connect",
            session_info: await login(newUsernameValue, newPasswordValue)
        })
    }

    function handleDisconnectFunc(){
        dispatch({
            type:"user_clicks_disconnect"
        })
    }
    // !! The value of the context now contains the function used in the reducer for use throughout the app
    // Normally this is done by making two contexts, e.g.: UserContext which provides the state and UserDispatch
    // which provides the function that modify the state. Ref: https://react.dev/learn/scaling-up-with-reducer-and-context
    return(
        <UserContext.Provider value={
            {...user,
            connectFunction: handleConnectFunc, disconnectFunction: handleDisconnectFunc}
        }>
            {children}
        </UserContext.Provider>
    );
}

export function useUser(){
    const user = useContext(UserContext);
    return user;
}
//End of session management and useUser