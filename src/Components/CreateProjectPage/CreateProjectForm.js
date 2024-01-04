import {Form} from "react-router-dom";

export default function CreateProjectForm(){

    return(
        <div>
            <Form method="post">
                <input type="text" name="name" placeholder="Nom du projet"/>
                <input type="text" name="description" placeholder="Description du projet"/>
                <input type="text" name="organization" placeholder="Nom de l'organisation (créée au préalable)"/>
                <input type="number" name="collaborators_min" placeholder="Minimum requis de collaborateurs"/>
                <input type="number" name="collaborators_max" placeholder="Maximum autorisé de collaborateurs"/>
                <input type="text" name="group_tag" placeholder="ex : Groupe-[XX]"/>
                <button type="submit">
                    Créer
                </button>
            </Form>
        </div>
    );
}