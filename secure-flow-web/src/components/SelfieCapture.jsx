function SelfieCapture({ config, onComplete }) {
    return (
        <div style={styles.card}>
            <h2>Selfie Verification</h2>
            <p>Please take a selfie to verify your identity.</p>

            <div style={styles.placeholder}>
                <div style={styles.circle}>
                    [ FACE ]
                </div>
            </div>

            <button style={styles.button} onClick={() => onComplete({ image: "base64_selfie_placeholder" })}>
                Take Selfie & Finish
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
        height: '300px',
        background: '#333',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        position: 'relative'
    },
    circle: {
        border: '2px dashed #fff',
        borderRadius: '50%',
        width: '200px',
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8
    },
    button: {
        padding: '10px 20px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    }
}

export default SelfieCapture
