import QRCode from "react-qr-code";

export default function QRCodeDisplay({props}) {
    console.log(props);
    return (
        <div className="fixed-window">
            <h1>Scannez le QR Code pour créer votre groupe</h1>
            <QRCode
                size={256}
                style={{height: "auto", maxWidth: "50%", width: "50%"}}
                value={props.url}
            />
            <button className="copy-url" onClick={()=>{
                props.displayQR(false);
            }}>Retour</button>
        </div>
    )
}