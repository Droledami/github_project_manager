import {redirect, useLoaderData} from "react-router";
import {authorisationCheck} from "../userFunctions";
import ProjectList from "../Components/ProjectsPage/ProjectList";
import {Link} from "react-router-dom";
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

    return (
        <>
            <ProjectList props={{projects}}/>
            <Link to="/project/new">Nouveau</Link>
        </>
    );
}