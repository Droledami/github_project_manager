const projects = ["projet dur", "projet omg", "projet facile", "projet bordel j'en chiale du cul"];

export default function ProjectList(){
    return(
        <div>
            {projects.map((project) =>
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