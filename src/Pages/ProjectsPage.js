import {useUser} from "../customHooks";
import {redirect} from "react-router";
import {authorisationCheck} from "../userFunctions";
import ProjectList from "../Components/ProjectsPage/ProjectList";
import {Link} from "react-router-dom";

const projects = ["projet dur", "projet omg", "projet facile", "projet bordel j'en chiale du cul"];

export async function loader() {
    const checkIfAuthorised = await authorisationCheck();
    if (checkIfAuthorised)
        return null;
    else
        return redirect("/login");
}

export default function ProjectsPage() {

    const user = useUser()

    return (
        <>
            <ProjectList props={{projects}}/>
            <Link to="/project/new">Nouveau</Link>
        </>
    );
}