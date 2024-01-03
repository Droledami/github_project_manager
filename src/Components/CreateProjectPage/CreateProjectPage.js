

export default function CreateProjectPage(){

    return(
        <div>
            <form>
                <input type="text" name="project"/>
                <input type="text" name="organization"/>
                <input type="text" name="collaborators-min"/>
                <input type="text" name="collaborators-max"/>
                <input type="text" name="group-name"/>
                <button type="submit">
                    Donnez-moi cet URL!
                </button>
            </form>
        </div>
    );
}