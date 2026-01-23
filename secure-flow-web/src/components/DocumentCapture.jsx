function DocumentCapture({ config, onComplete }) {
    return (
        <div style={styles.card}>
            <h2>Document Capture ({config.side})</h2>
            <p>Please upload your {config.side} ID.</p>

            <div style={styles.placeholder}>
                [ CAMERA PREVIEW WOULD GO HERE ]
            </div>

            <button style={styles.button} onClick={() => onComplete({ image: "base64_placeholder" })}>
                Capture & Continue
            </button>
        </div>
    )
}

const styles = {
    card: {
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '8px',
        background: '#f9f9f9'
    },
    placeholder: {
        width: '100%',
        height: '200px',
        background: '#333',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
    },
    button: {
        padding: '10px 20px',
        background: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    }
}

export default DocumentCapture
