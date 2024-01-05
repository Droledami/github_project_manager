export async function sendProjectData(projectData, projectId){
    const sessionData = localStorage.getItem("token");
    if(!projectId){ //nouveau projet
        const newProjectRequestObject = {project_data: {...projectData}, tokens: {...JSON.parse(sessionData)}};
        const response = await fetch('http://localhost:8080/project',
            {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(newProjectRequestObject)});
        return response.status;
    }else{ //modifier le projet
        const newProjectRequestObject = {project_data: {...projectData, project_id : projectId}, tokens: {...JSON.parse(sessionData)}};
        const response = await fetch('http://localhost:8080/project',
            {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(newProjectRequestObject)});
        return response.status;
    }
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