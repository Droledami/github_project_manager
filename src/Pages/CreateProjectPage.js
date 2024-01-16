import {authorisationCheck} from "../userFunctions";
import {redirect, useLoaderData} from "react-router";
import CreateProjectForm from "../Components/CreateProjectPage/CreateProjectForm";
import {getProjectById, sendProjectData, validateGroupTag} from "../projectFunctions";

export async function loader({params}) {
    const checkIfAuthorised = await authorisationCheck();
    if (checkIfAuthorised) {
        if (params.id) {
            const project = await getProjectById(params.id);
            return {project}
        } else
            return {project: null};
    } else
        return redirect("/login");
}

export async function action({request, params}) {
    const formData = await request.formData();
    const projectData = Object.fromEntries(formData);
    if (projectData.name.length < 3) {
        alert("Veuillez donner un nom au projet (au moins 3 caractères)");
        return null;
    }
    if (projectData.collaborators_min < 1) {
        alert("Le nombre de collaborateurs minimum est incorrect (1 au minimum possible)");
        return null;
    }
    if (projectData.collaborators_max < 1) {
        alert("Le nombre de collaborateurs maximum est incorrect (ne peut pas être plus petit que 1)");
        return null;
    }
    if (!validateGroupTag(projectData.group_tag)) {
        alert("Le modèle du groupe est incorrect");
        return null;
    }
    const responseStatus = await sendProjectData(projectData, params.id);
    if (responseStatus === 200) {
        return redirect("/");
    } else if (responseStatus === 406) {
        alert("Organisation non trouvée, vérifiez le nom entré de l'organsation puis réessayez.");
        return null;
    } else {
        alert("Une erreur est survenue lors du traitement des données, assurez vous que les champs sont tous complétés de manière correcte, puis réessayez");
        return null;
    }
}

export default function CreateProjectPage() {

    const {project} = useLoaderData(); //!can be null.

    return (
        <>
            <h1 className="title">
                {project === null ? "Nouveau projet" : `Modifier le projet ${project.Name}`}
            </h1>
            <CreateProjectForm project={project}/>
        </>
    );
}