import {useLoaderData, useParams} from "react-router";
import {getProjectByUrl} from "../projectFunctions";
import GitHubUsernameEntry from "../Components/CreateRepositoryPage/GitHubUsernameEntry";
import {useMembers} from "../customHooks";
import {sendRepositoryData} from "../repositoryFunctions";
import {useState} from "react";
import FeedbackForm from "../Components/CreateRepositoryPage/FeedbackForm";
import MembersList from "../Components/CreateRepositoryPage/MembersList";

export async function loader({params}) {
    const project = await getProjectByUrl(params.url)
    return {project};
}

export default function CreateRepositoryPage() {
    const {url} = useParams();
    const {project} = useLoaderData();
    const members = useMembers();

    const [formState, setFormState] = useState({status: "unsent", message: "Aucune donné envoyée..."});

    console.log(members);

    async function sendAndWaitForValidation() {
        setFormState({status: "sent", message: "Données envoyées... En attente d'une réponse..."});
        const response = await sendRepositoryData(members.members_list, url);
        if (response.status === 201) {
            setFormState({
                status: "valid",
                message: `Le repository ${response.data.repository_name} a été créé et vous a été attribué.\n Acceptez l'invitation GitHub dans vos e-mails pour y accéder.`
            });
        } else {
            console.log(response.status);
            if (response.status === 403)
                setFormState({
                    status: "invalid",
                    message: "Plus de place dans le plan de l'organisation, contactez votre professeur."
                });
            if (response.status === 500)
                setFormState({
                    status: "invalid",
                    message: `Erreur serveur, réessayez un peu plus tard. Si l'erreur persiste contactez votre professeur.\n${response.data.error}`
                });
            if (response.status === 400) {
                setFormState({status: "invalid", message: response.data.error});
            }
        }
    }

    return (
        <>
            <h1 className="title">
                Créer un groupe
            </h1>
            {formState.status !== "valid" && <div className="centered-list">
                <div className="create-group">
                    <p className="tooltip">Créer un groupe pour le projet :</p>
                    <div className="project-title">
                        {project.Name}
                    </div>
                </div>
                <div className="project-rules">
                    Règles: <br/>
                    <ul>
                        <li>
                            Au
                            moins {project.MinCollaborators} {project.MinCollaborators > 1 ? "participants" : "participant"} et
                            maximum {project.MaxCollaborators} participants
                        </li>
                    </ul>
                </div>
                <div className="members-list">
                    <MembersList membersList={members.members_list}/>
                    {(members.members_list.length < project.MaxCollaborators) && <GitHubUsernameEntry/>}
                    {((members.members_list.length >= project.MinCollaborators) && formState !== "valid") &&
                        <button className="positive" type="submit" onClick={() => sendAndWaitForValidation()}>
                            Valider et créer le groupe
                        </button>
                    }
                </div>
            </div>}
            {formState.status !== "unsent" && <FeedbackForm props={{
                ...formState, resetForm: () => {
                    setFormState({status: "unsent", message: "Aucune donné envoyée..."})
                }
            }}/>}
        </>
    );
}