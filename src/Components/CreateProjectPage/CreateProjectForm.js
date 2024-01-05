import {Form} from "react-router-dom";
import {useState} from "react";

export default function CreateProjectForm({props}){

    const [projectName, setProjectName] = useState(props === null ? "" : props.project.Name);
    const [projectDescription, setProjectDescription] = useState(props === null ? "" : props.project.Description);
    const [projectOrganization, setProjectOrganization] = useState(props === null ? "" : props.project.Organization);
    const [projectCollaboratorsMin, setProjectCollaboratorsMin] = useState(props === null ? "" : props.project.MinCollaborators);
    const [projectCollaboratorsMax, setProjectCollaboratorsMax] = useState(props === null ? "" : props.project.MaxCollaborators);
    const [projectGroupTag, setProjectGroupTag] = useState(props === null ? "" : props.project.TaggedGroup);

    return(
        <div>
            <Form method="post">
                <input type="text" name="name" placeholder="Nom du projet" value={projectName} onChange={(e)=>{setProjectName(e.currentTarget.value)}}/>
                <input type="text" name="description" placeholder="Description du projet" value = {projectDescription} onChange={(e)=> setProjectDescription(e.currentTarget.value)}/>
                <input type="text" name="organization" placeholder="Nom de l'organisation (créée au préalable)" value={projectOrganization} onChange={(e)=> setProjectOrganization(e.currentTarget.value)}/>
                <input type="number" name="collaborators_min" placeholder="Minimum requis de collaborateurs" value = {projectCollaboratorsMin} onChange={(e)=> setProjectCollaboratorsMin(e.currentTarget.value)}/>
                <input type="number" name="collaborators_max" placeholder="Maximum autorisé de collaborateurs" value = {projectCollaboratorsMax} onChange={(e)=> setProjectCollaboratorsMax(e.currentTarget.value)}/>
                <input type="text" name="group_tag" placeholder="ex : Groupe-[XX]" value={projectGroupTag} onChange={(e)=> setProjectGroupTag(e.currentTarget.value)}/>
                <button type="submit">
                    {props === null ? "Créer" : "Appliquer"}
                </button>
            </Form>
        </div>
    );
}