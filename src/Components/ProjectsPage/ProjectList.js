export default function ProjectList({props}){
    return(
        <div>
            {props.projects.map((project) =>
                <ProjectListElement project ={project}/>
            )}
        </div>
    );
}

function ProjectListElement({project}){

    return (
        <div>
            {project}
        </div>
    );
}