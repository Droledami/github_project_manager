import {useLoaderData, useParams} from "react-router";
import {Form} from "react-router-dom";
import {getProjectByUrl} from "../projectFunctions";
import GitHubUsernameEntry from "../Components/CreateRepositoryPage/GitHubUsernameEntry";
import {useMembers} from "../customHooks";
import GitHubUserCard from "../Components/CreateRepositoryPage/GitHubUserCard";
import {sendRepositoryData} from "../repositoryFunctions";

export async function loader({params}) {
    const project = await getProjectByUrl(params.url)
    return {project};
}

export async function action({request, params}) {
    const formData = await request.formData();
    const repositoryData = Object.fromEntries(formData);
    const response = await sendRepositoryData(repositoryData, params.url);
    //TODO: filter through responses
}

export default function CreateRepositoryPage() {
    const {url} = useParams();
    const {project} = useLoaderData();
    const members = useMembers();

    console.log(members);
    return (
        <>
            <div>
                Projet {project.Name}
            </div>
            <div>
                Collaborateurs minimum : {project.MinCollaborators} <br/>
                Collaborateurs maximum : {project.MaxCollaborators}
            </div>
            <Form>
                <MembersList membersList={members.members_list}/>
                {(members.members_list.length < project.MaxCollaborators) && <GitHubUsernameEntry/>}
                {(members.members_list.length >= project.MinCollaborators) &&
                    <button type="submit" >
                        Valider et créer le groupe
                    </button>
                }
            </Form>
        </>
    );
}

function MembersList({membersList}) {

    if (membersList.length === 0) {
        return <div>
            Aucun membre
        </div>
    }
    return membersList.map((member) =>
        <GitHubUserCard props={{member}}/>
    )
}