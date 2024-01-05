import {useUser} from "../customHooks";
import {authorisationCheck} from "../userFunctions";
import {redirect} from "react-router";
import CreateProjectForm from "../Components/CreateProjectPage/CreateProjectForm";
import {sendProjectData, validateGroupTag} from "../projectFunctions";

export async function loader() {
    const checkIfAuthorised = await authorisationCheck();
    if (checkIfAuthorised)
        return null;
    else
        return redirect("/login");
}

export async function action({request, params}) {
    const formData = await request.formData();
    const projectData = Object.fromEntries(formData);
    if(projectData.name.length < 3){
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
    const responseStatus = await sendProjectData(projectData, params.projectId);
    if (responseStatus === 200) {
        return redirect("/");
    } else if (responseStatus === 406) {
        alert("Organisation non trouvée, vérifiez le nom entré de l'organsation puis réessayez.");
        return null;
    } else {
        alert("Une erreur est survenue lors du traitement des données, assurez vous que les champs sont tous complétés de manière correct, puis réessayez");
        return null;
    }
}

export default function CreateProjectPage() {
    const user = useUser();

    return (
        <>
            <CreateProjectForm/>
        </>
    );
}