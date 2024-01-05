import {useUser} from "../customHooks";
import {redirect, useLoaderData} from "react-router";
import {authorisationCheck} from "../userFunctions";
import ProjectList from "../Components/ProjectsPage/ProjectList";
import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import {getAllProjects} from "../projectFunctions";

//const projects = ["projet dur", "projet omg", "projet facile", "projet bordel j'en chiale du cul"];

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

    const user = useUser();
    const {projects} = useLoaderData();

    return (
        <>
            <ProjectList props={{projects}}/>
            <Link to="/project/new">Nouveau</Link>
        </>
    );
}