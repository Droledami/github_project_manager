import {useMembers} from "../../customHooks";
import {useState} from "react";

export default function GitHubUsernameEntry() {

    const members = useMembers()
    const [username, setUsername] = useState("");

    return (
        <div>
            <input type="text" placeholder="Ajouter un membre" name={`username_${members.members_list.length}`}
                   value={username} onChange={(e)=> setUsername(e.currentTarget.value)}/>
            <button type="button" onClick={async () => {
                await members.addMember(username);
                setUsername("");
            }}>+
            </button>
        </div>
    );
}