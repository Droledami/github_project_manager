
export default function FeedbackForm({props}){

    const feedbackMessage = props.message;
    const status = props.status;
    console.log(status);

    function titleMessage(){
        switch(status){
            case "sent":
                return "Chargement..."
            case "invalid":
                return "Erreur...";
            case "valid":
                return "Tout est prêt!";
            default:
                return "Erreur inconnue...";
        }
    }

    return(
        <div className="feedback-form">
            <h1>{titleMessage()}</h1>
            <p>
                {feedbackMessage}
            </p>
            {(status === "invalid" || !status) && <button onClick={()=>props.resetForm()}>Retour</button>}
        </div>
    );
}