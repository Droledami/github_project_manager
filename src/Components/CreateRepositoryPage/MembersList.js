import GitHubUserCard from "./GitHubUserCard";

export default function MembersList({membersList}) {

    if (membersList.length === 0) {
        return <div>
            Encore aucun membre n'a été ajouté.
        </div>
    }
    return membersList.map((member) =>
        <GitHubUserCard props={{member, readOnly:false}}/>
    )
}