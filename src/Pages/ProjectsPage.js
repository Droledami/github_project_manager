import {redirect, useLoaderData, useNavigate} from "react-router";
import {authorisationCheck} from "../userFunctions";
import ProjectList from "../Components/ProjectsPage/ProjectList";
import {getAllProjects} from "../projectFunctions";

export async function loader() {
    const checkIfAuthorised = await authorisationCheck();
    if (checkIfAuthorised){
        const projects = await getAllProjects();
        return {projects};
    }
    else
        return redirect("/login");
}

export default function ProjectsPage() {

    const {projects} = useLoaderData();
    const navigate = useNavigate();

    return (
        <>
            <ProjectList props={{projects}}/>
            <button className="new-button" onClick={()=> navigate("/project/new")}>Nouveau <br/>Projet</button>
        </>
    );
}