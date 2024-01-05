import {Link} from "react-router-dom";

export default function ProjectList({props}) {
    return (
        <div>
            {props.projects.map((project) =>
                <ProjectListElement project={project}/>
            )}
        </div>
    );
}

function ProjectListElement({project}) {
    console.log(project);
    return (
        <>
            <Link to={`project/${project.ProjectId}`}>
                <div>
                    {project.Name}
                </div>
                <div>
                    Créé le {dateToString(new Date(parseInt(project.DateOfCreation)))}
                </div>
                <div>
                    {project.Description === "" ? "Aucune description" : project.Description}
                </div>
            </Link>
            <button>URL</button>
        </>
    );
}

function dateToString(date) {
    const locale = "fr-FR";
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    }
    return (date.toLocaleDateString(locale, options));
}