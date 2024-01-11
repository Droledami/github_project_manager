export async function sendRepositoryData(repositoryData, url){
    const response = await fetch(`http://localhost:8080/repository?url=${url}`,
        {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(repositoryData)});
    return {status: response.status, data : await response.json()};
}


/**Verifies username's identity on GitHub via api
 * Returns null if the entry is considered invalid or if it's not found**/
export async function getGitHubUserData(username){
    if(username.replaceAll(" ", "") === "") return null;
    const response = await fetch(`http://localhost:8080/githubdata?username=${username}`);
    if(response.status === 200){
        return await response.json();
    }else{
        return null;
    }
}