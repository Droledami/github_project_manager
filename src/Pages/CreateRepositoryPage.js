import {useLoaderData, useNavigate, useParams} from "react-router";
import {getProjectByUrl} from "../projectFunctions";
import GitHubUsernameEntry from "../Components/CreateRepositoryPage/GitHubUsernameEntry";
import {useMembers} from "../customHooks";
import GitHubUserCard from "../Components/CreateRepositoryPage/GitHubUserCard";
import {sendRepositoryData} from "../repositoryFunctions";

export async function loader({params}) {
    const project = await getProjectByUrl(params.url)
    return {project};
}

export default function CreateRepositoryPage() {
    const {url} = useParams();
    const {project} = useLoaderData();
    const members = useMembers();
    const navigate = useNavigate();

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
            <div>
                <MembersList membersList={members.members_list}/>
                {(members.members_list.length < project.MaxCollaborators) && <GitHubUsernameEntry/>}
                {(members.members_list.length >= project.MinCollaborators) &&
                    <button type="submit" onClick={async () => {
                        const response = await sendRepositoryData(members.members_list, url);
                    }}>
                        Valider et créer le groupe
                    </button>
                }
            </div>
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