import {useUser} from "../customHooks";
import {authorisationCheck} from "../userFunctions";
import {redirect} from "react-router";
import CreateProjectForm from "../Components/CreateProjectPage/CreateProjectForm";
import {sendProjectData} from "../projectFunctions";

export async function loader() {
    const checkIfAuthorised = await authorisationCheck();
    if (checkIfAuthorised)
        return null;
    else
        return redirect("/login");
}

export async function action({request, params}){
    const formData = await request.formData();
    const projectData = Object.fromEntries(formData);
    const isSuccess = await sendProjectData(projectData, params.projectId);
    if(isSuccess){
        return redirect("/");
    }else{
        alert("Error sending project data, please make sure all fields are completed and try again");
        return null;
    }
}

export default function CreateProjectPage(){
    const user = useUser();

    return(
      <>
          <CreateProjectForm/>
      </>
    );
}