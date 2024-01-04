export async function login(username, password) {
    const userObject = {username: username, password};
    const response = await fetch(`http://localhost:8080/login`,
        {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(userObject)});
    try {
        const json = await response.json();
        return {teacher_id: json.teacher_id, token: json.token, refresh_token: json.refresh_token};
    } catch (e) {
        console.log("Impossible to login : " + e.message);
        return {teacher_id: undefined, token: undefined, refresh_token: undefined}
    }
}

function tokenRefresh(newTokens){
    console.log("Tokens have refreshed, new values are : ");
    console.log(newTokens);
    localStorage.setItem('token', JSON.stringify(newTokens));
}

export async function checkMe() {
    const sessionData = localStorage.getItem('token');
    if (!sessionData) return false;
    const response = await fetch(`http://localhost:8080/me`,
        {method: "POST", headers: {"Content-Type": "application/json"}, body: sessionData});
    switch (response.status){
        case 200: //authorised
            return true;
        case 201: //authorised, token renewed
            const json = await response.json();
            tokenRefresh({teacher_id: json.teacher_id, token: json.token, refresh_token: json.refresh_token})
            return true;
        case 401: //unauthorised
            localStorage.removeItem('token');
            return false;
        case 500: //server error, sent data might be in unexpected format
            localStorage.removeItem('token');
            return false;
        default:
            localStorage.removeItem('token');
            return false;
    }
}

export function checkIfSessionExists() {
    return localStorage.getItem('token');
}

export async function authorisationCheck() {
    if (!checkIfSessionExists())
        return false;
    const checkIfAuthorised = await checkMe();
    if (!checkIfAuthorised)
        return false;
    else
        return true;
}