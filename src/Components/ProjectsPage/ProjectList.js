import {Link} from "react-router-dom";
import {copyUrlToClipboard} from "../../projectFunctions";

export default function ProjectList({props}) {
    return (
        <>
            <h1 className="title">
                Liste des projets
            </h1>
            <div className="centered-list">
                {props.projects.map((project) =>
                    <ProjectListElement project={project}/>
                )}
            </div>
        </>
    );
}

function ProjectListElement({project}) {
    console.log(project);
    return (
        <>
            <div className="project-area-row">
                <div className="project-area-col">
                    <Link to={`project/${project.ProjectId}`} style={{textDecoration:"none"}}>
                        <div className="project-header">
                            <div className="project-title">
                                {project.Name}
                            </div>
                            <div className="project-date">
                                {dateToString(new Date(parseInt(project.DateOfCreation)))}
                            </div>
                        </div>
                        <div className="project-description">
                            {project.Description === "" ? "Aucune description" : project.Description}
                        </div>
                    </Link>
                </div>
                <button className="copy-url" onClick={(e) => {
                    e.stopPropagation()
                    copyUrlToClipboard(project)
                }}>Copier l'url
                </button>
            </div>
        </>
    );
}

function dateToString(date) {
    const locale = "fr-FR";
    const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric"
    }
    return (date.toLocaleDateString(locale, options));
}