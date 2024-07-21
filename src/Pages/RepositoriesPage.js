import {authorisationCheck} from "../userFunctions";
import {getProjectRepositoryData} from "../projectFunctions";
import {redirect, useLoaderData} from "react-router";
import {createContext, useState} from "react";
import RepositoriesListComponant from "../Components/RepositoriesPage/RepositoriesListComponant";

export async function loader({params}) {
    const checkIfAuthorised = await authorisationCheck();
    if (checkIfAuthorised) {
        if (params.id) {
            const repositoriesData = await getProjectRepositoryData(params.id);
            return repositoriesData;
        } else
            return null;
    } else
        return redirect("/login");
}

export const RepositoriesContext = createContext(null);

export default function RepositoriesPage() {

    const repositoriesData = useLoaderData();
    const [showingGitURLs, setShowingGitURLs] = useState(false);

    return (
        <RepositoriesContext.Provider
            value={{repositories: repositoriesData.repositories, switchURLsState: setShowingGitURLs, showURLs: showingGitURLs}}>
            <h1 className="title">Liste des repos</h1>
            <h3 className="title">{repositoriesData.project_name}</h3>
            <button className="show-clone-options"
                    onClick={() => setShowingGitURLs(!showingGitURLs)}>{showingGitURLs ? "Cacher" : "Montrer"} URLs <br/>de
                clônage
            </button>
            <div className="centered-list">
                <RepositoriesListComponant/>
            </div>
        </RepositoriesContext.Provider>
    );
}