import {useContext} from "react";
import {RepositoriesContext} from "../../Pages/RepositoriesPage";
import GitHubUserCard from "../CreateRepositoryPage/GitHubUserCard";

export default function RepositoriesListComponant() {
    const repositoriesContext = useContext(RepositoriesContext);

    return (
        <>
            {repositoriesContext.repositories.map((repository) => <RepositoryListItem props={repository}/>)}
        </>
    );
}

function RepositoryListItem({props}) {
    const repositoriesContext = useContext(RepositoriesContext);
    const showingURLs = repositoriesContext.showURLs;

    const repository = props.repository;

    return (
        <div className="repository-area">
            <div className="project-area-row">
                {repository.name}
            </div>
            {showingURLs && <>
                <div className="git-url">
                <p className="tooltip-top">https:</p>
                    {repository.clone_url}
                </div>
                <div className="git-url">
                <p className="tooltip-top">ssh:</p>
                    {repository.ssh_url}
                </div>
            </>
            }
            {repository.collaborators.map((collaborator) => <GitHubUserCard
                props={{
                    member: {
                        git_hub_username: collaborator.git_hub_username,
                        avatar_url: collaborator.avatar_url,
                        name: collaborator.name,
                        bio: collaborator.bio
                    },
                    readOnly: true
                }}/>)}
        </div>
    );
}