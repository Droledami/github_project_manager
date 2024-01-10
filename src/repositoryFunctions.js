export async function sendRepositoryData(repositoryData, url){
    const response = await fetch(`http://localhost:8080/repository?url=${url}`,
        {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(repositoryData)});
    return response.status;
}

export async function getGitHubUserData(username){
    const response = await fetch(`http://localhost:8080/githubdata?username=${username}`);
    if(response.status === 200){
        return await response.json();
    }else{
        return null;
    }
}