export async function sendProjectData(projectData, projectId){
    const sessionData = localStorage.getItem("token");
    if(!projectId){
        const newProjectRequestObject = {project_data: {...projectData}, tokens: {...JSON.parse(sessionData)}};
        const response = await fetch('http://localhost:8080/project',
            {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(newProjectRequestObject)});

        //nouveau projet
    }else{
        //modifier le projet
    }
}