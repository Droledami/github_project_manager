import {useMembers} from "../../customHooks";

export default function GitHubUserCard({props}) {
    const displayedMember = props.member.git_hub_username;
    const avatarUrl = props.member.avatar_url;
    const name = props.member.name;

    const members = useMembers();

    return (
        <div>
            {name && <div>
                {name}
            </div>}
            <div>
                {displayedMember}
            </div>
            <img src={avatarUrl} alt={`Profile picture of ${displayedMember}`} height={100} width={100}/>
            <button onClick={() => {
                members.deleteMember(displayedMember);
            }}>-
            </button>
        </div>
    );
}