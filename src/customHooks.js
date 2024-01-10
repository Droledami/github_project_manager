import React, {createContext, useContext, useReducer} from "react";
import {login} from "./userFunctions";
import {getGitHubUserData} from "./repositoryFunctions";

/**Start of session management and useUser**/
const UserContext = createContext(null);

const guestUser = {teacher_id: undefined, token: undefined, refresh_token: undefined}

function setSession(tokens) {
    console.log(tokens);
    localStorage.setItem('token', JSON.stringify(tokens));
}

function getSession() {
    const sessionString = localStorage.getItem('token');
    if (!sessionString) return guestUser;
    const session = JSON.parse(sessionString);
    return session;
}

function clearSession() {
    localStorage.removeItem('token');
}

export function UserProvider({children}) {

    const initialUser = getSession();
    const [user, dispatch] = useReducer(userReducer, initialUser);

    function userReducer(user, action) {
        switch (action.type) {
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

    async function handleConnectFunc(newUsernameValue, newPasswordValue) {
        dispatch({
            type: "user_clicks_connect",
            session_info: await login(newUsernameValue, newPasswordValue)
        })
    }

    function handleDisconnectFunc() {
        dispatch({
            type: "user_clicks_disconnect"
        })
    }

    // !! The value of the context now contains the function used in the reducer for use throughout the app
    // Normally this is done by making two contexts, e.g.: UserContext which provides the state and UserDispatch
    // which provides the function that modify the state. Ref: https://react.dev/learn/scaling-up-with-reducer-and-context
    return (
        <UserContext.Provider value={
            {
                ...user,
                connectFunction: handleConnectFunc, disconnectFunction: handleDisconnectFunc
            }
        }>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}

//End of session management and useUser

/**Start of definition of useMembers to add in the CreateRepositoryPage**/
const MembersContext = createContext(null);

export function MembersProvider({children}) {
    const [members, dispatch] = useReducer(membersReducer, {members_list: []});

    //format of a member in members_list: {git_hub_username:Jodo, name:John, avatar_url: https://test/image/jiosef}
    function membersReducer(members, action) {
        switch (action.type) {
            case "add_member_is_clicked":
                if (action.new_member !== null)
                    return {...members, members_list: [...members.members_list, action.new_member]};
                else {
                    alert("Could not find that GitHub user");
                    return {...members}
                }
            case "delete_member_is_clicked":
                return {
                    ...members,
                    members_list: [...members.members_list.filter(member => member.git_hub_username !== action.member_to_delete)]
                };
            default:
                console.error("Unexpected action in membersReducer");
                return members;
        }
    }

    async function handleAddMember(member) {
        dispatch({
            type: "add_member_is_clicked",
            new_member: await getGitHubUserData(member)
        });
    }

    async function handleDeleteMember(member) {
        dispatch({
            type: "delete_member_is_clicked",
            member_to_delete: member
        })
    }

    return (
        <MembersContext.Provider value={{...members, deleteMember: handleDeleteMember, addMember: handleAddMember}}>
            {children}
        </MembersContext.Provider>
    );
}

export function useMembers() {
    return useContext(MembersContext);
}