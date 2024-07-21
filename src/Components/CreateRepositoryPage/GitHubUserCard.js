import {useMembers} from "../../customHooks";

export default function GitHubUserCard({props}) {
    const displayedMember = props.member.git_hub_username;
    const avatarUrl = props.member.avatar_url;
    const name = props.member.name;
    const bio = props.member.bio;

    const readOnly = props.readOnly;

    const members = useMembers();

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    {displayedMember}
                </div>
                <div>
                    {name}
                </div>
                {!readOnly && <button className="negative" onClick={() => {
                    members.deleteMember(displayedMember);
                }}>Supprimer
                </button>}
            </div>
            <div className="card-body">
                <img src={avatarUrl} alt={`Profile picture of ${displayedMember}`} height={100} width={100}/>
                <p>
                    {bio === null ? <i>Pas de bio...</i>: bio}
                </p>
            </div>
        </div>
    );
}