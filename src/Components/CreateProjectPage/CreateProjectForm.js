import {Form} from "react-router-dom";
import {useState} from "react";
import {requestProjectDeletion} from "../../projectFunctions";
import {useNavigate} from "react-router";

export default function CreateProjectForm({project}) {
    const navigate = useNavigate();

    const [projectName, setProjectName] = useState(project === null ? "" : project.Name);
    const [projectDescription, setProjectDescription] = useState(project === null ? "" : project.Description);
    const [projectOrganization, setProjectOrganization] = useState(project === null ? "" : project.Organization);
    const [projectCollaboratorsMin, setProjectCollaboratorsMin] = useState(project === null ? "" : project.MinCollaborators);
    const [projectCollaboratorsMax, setProjectCollaboratorsMax] = useState(project === null ? "" : project.MaxCollaborators);
    const [projectGroupTag, setProjectGroupTag] = useState(project === null ? "Groupe-[XX]" : project.TaggedGroup);

    return (
        <div className="centered-list">
            <Form method="post">
                <p className="input-label">Nom du projet :</p>
                <input type="text" name="name" placeholder="Projet de location de livres" value={projectName}
                       onChange={(e) => {
                           setProjectName(e.currentTarget.value)
                       }}/>
                <p className="input-label">Description du projet :</p>
                <textarea name="description" placeholder="Projet Java des 2ème année..." value={projectDescription}
                          onChange={(e) => setProjectDescription(e.currentTarget.value)}/>
                <p className="input-label">Nom de l'organisation :</p>
                <input type="text" name="organization" placeholder="Nom de l'organisation (créée au préalable)"
                       value={projectOrganization} onChange={(e) => setProjectOrganization(e.currentTarget.value)}/>
                <div className="input-row">
                    <p className="input-label">Nombre de collaborateurs minimum :</p>
                    <p className="input-label">Nombre de collaborateurs maximum :</p>
                </div>
                <div className="input-row">
                    <input type="number" name="collaborators_min" placeholder="Minimum requis de collaborateurs"
                           value={projectCollaboratorsMin}
                           onChange={(e) => setProjectCollaboratorsMin(e.currentTarget.value)}/>
                    <input type="number" name="collaborators_max" placeholder="Maximum autorisé de collaborateurs"
                           value={projectCollaboratorsMax}
                           onChange={(e) => setProjectCollaboratorsMax(e.currentTarget.value)}/>
                </div>
                <p className="input-label">Tag des groupes de chaque projet :</p>
                <input type="text" name="group_tag" placeholder="ex : Groupe-[XX]" value={projectGroupTag}
                       onChange={(e) => setProjectGroupTag(e.currentTarget.value)}/>
                <p className="tooltip">Doit inclure au moins un X majuscule entre crochets []. Les X et leurs crochets
                    seront remplacés par les itérations des numéros de groupe</p>
                <div className="form-buttons">
                    {project && <button className="delete" onClick={async ()=> {
                        const status = await requestProjectDeletion(project);
                        if(status === 200){
                            navigate("/");
                        }
                    }}>Supprimer</button>}
                    <button className="send-data" type="submit">
                        {project === null ? "Créer" : "Appliquer"}
                    </button>
                </div>
            </Form>
        </div>
    );
}