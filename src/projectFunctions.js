export async function sendProjectData(projectData, projectId){
    const sessionData = localStorage.getItem("token");
    if(!projectId){ //nouveau projet
        const newProjectRequestObject = {project_data: {...projectData}, tokens: {...JSON.parse(sessionData)}};
        const response = await fetch('http://localhost:8080/project',
            {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(newProjectRequestObject)});
        return response.status;
    }else{ //modifier le projet
        const editProjectRequestObject = {project_data: {...projectData, project_id : projectId}, tokens: {...JSON.parse(sessionData)}};
        const response = await fetch('http://localhost:8080/project',
            {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(editProjectRequestObject)});
        return response.status;
    }
}

export async function requestProjectDeletion({project}){
    const sessionData = localStorage.getItem("token");
    const deleteProjectRequestObject = {project_id: project.ProjectId, tokens: {...JSON.parse(sessionData)}};
    const response = await fetch('http://localhost:8080/project',
        {method: "DELETE", headers: {"Content-Type": "application/json"}, body: JSON.stringify(deleteProjectRequestObject)});
    return response.status;
}

/**
 * Returns the group tag if it's verified, otherwise returns null
 */
export function validateGroupTag(groupTag){
    //Look for []. Any number of X in between and the brackets themselves will be replaced by iterated numbers
    const regex = /.*\[X+].*/
    const [result] = groupTag.match(regex);
    return result
}

export let repositoryNameIsValid = false;

export function createRepositoryNamePreview(taggedGroup, previewNumber) {
    const regex = /.*\[(X+)].*/
    const parts = taggedGroup.match(regex);
    if(!parts || parts.length !== 2){
        repositoryNameIsValid = false;
        return taggedGroup;
    }
    const numberOfX = parts[1].length;
    const repositoryNumberOfDigits = `${previewNumber}`.length;
    const numberOfZeros = numberOfX - repositoryNumberOfDigits;
    if (numberOfZeros < 0) {
        repositoryNameIsValid = false;
        return `${taggedGroup}. Pas assez de X pour ce numéro de groupe`
    }
    let numberStr = ""
    for (let i = 0; i < numberOfZeros; i++) {
        numberStr += "0";
    }
    numberStr += `${previewNumber}`;
    repositoryNameIsValid = true;
    return taggedGroup.replace(`[${parts[1]}]`, numberStr);
}

export async function getAllProjects(){
    const sessionData = JSON.parse(localStorage.getItem("token"));
    const response = await fetch(`http://localhost:8080/projects?teacherId=${sessionData.teacher_id}`);
    if(response.status === 200){
        return await response.json();
    }else{
        return null;
    }
}

export async function getProjectById(projectId){
    const sessionData = JSON.parse(localStorage.getItem("token"));
    const response = await fetch(`http://localhost:8080/project?id=${projectId}&teacherId=${sessionData.teacher_id}`);
    if(response.status === 200){
        return await response.json();
    }else{
        return null;
    }
}

export async function getProjectByUrl(projectUrl){
    const response = await fetch(`http://localhost:8080/project?url=${projectUrl}`);
    if(response.status === 200){
        return await response.json();
    }else{
        return null;
    }
}

export async function getProjectRepositoryData(projectId){
    const sessionData = JSON.parse(localStorage.getItem("token"));
    const response = await fetch(`http://localhost:8080/repositories?id=${projectId}&teacherId=${sessionData.teacher_id}`);
    if(response.status === 200){
        return await response.json();
    }else{
        return null;
    }
}

export function copyUrlToClipboard(project){
    const url = window.location.href;
    navigator.clipboard.writeText(url + "repository/" + project.Url);
}