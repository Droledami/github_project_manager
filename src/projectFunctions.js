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

export async function getAllProjects(){
    const response = await fetch('http://localhost:8080/projects');
    if(response.status === 200){
        return await response.json();
    }else{
        return null;
    }
}

export async function getProjectById(projectId){
    const response = await fetch(`http://localhost:8080/project?id=${projectId}`);
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

export function copyUrlToClipboard(project){
    const url = window.location.href;
    navigator.clipboard.writeText(url + "repository/" + project.Url);
}