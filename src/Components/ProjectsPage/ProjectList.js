import {Link} from "react-router-dom";
import {copyUrlToClipboard} from "../../projectFunctions";
import {useState} from "react";
import QRCodeDisplay from "./QRCodeDisplay";

export default function ProjectList({props}) {
    const [projectUrlForQR, setProjectUrlForQR] = useState(undefined);

    function handleQRDisplay(urlForQR) {
        setProjectUrlForQR(urlForQR);
    }

    return (
        <>
            <h1 className="title">
                Liste des projets
            </h1>
            {props.projects && <div className="centered-list">
                {props.projects.map((project) =>
                    <ProjectListElement props={{project, displayQR: handleQRDisplay}}/>
                )}
            </div>}
            {!props.projects && <div className="centered-list">
                Aucun projet...
            </div>}
            {projectUrlForQR && <QRCodeDisplay props={{url: projectUrlForQR, displayQR: handleQRDisplay}}/>}
        </>
    );
}

function ProjectListElement({props}) {
    return (
        <>
            <div className="project-area-row">
                <div className="project-area-col">
                    <Link to={`project/${props.project.ProjectId}`} style={{textDecoration: "none"}}>
                        <div className="project-header">
                            <div className="project-title">
                                {props.project.Name}
                            </div>
                            <div className="project-date">
                                {dateToString(new Date(parseInt(props.project.DateOfCreation)))}
                            </div>
                        </div>
                        <div className="project-description">
                            {props.Description === "" ? "Aucune description" : props.project.Description}
                        </div>
                    </Link>
                </div>
                <div className="buttons-col">
                    <button className="copy-url" onClick={(e) => {
                        e.stopPropagation();
                        copyUrlToClipboard(props.project);
                    }}>Copier l'url</button>
                    <button className="copy-url" onClick={(e) => {
                        e.stopPropagation();
                        props.displayQR(`http://localhost:8080/repository/${props.project.Url}`);
                    }}>QR Code</button>
                </div>
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