import { useState } from 'react';

function SelfieCapture({ config, token, onComplete }) {
    const [uploading, setUploading] = useState(false);

    const handleCapture = async () => {
        setUploading(true);
        try {
            // 1. Create a dummy selfie blob
            const blob = await new Promise(resolve => {
                const canvas = document.createElement('canvas');
                canvas.width = 480;
                canvas.height = 640; // Portrait for selfie
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#e0e0f0';
                ctx.fillRect(0, 0, 480, 640);
                ctx.fillStyle = '#333';
                ctx.font = '30px Arial';
                ctx.fillText(`Selfie - ${new Date().toISOString()}`, 50, 320);
                canvas.toBlob(resolve, 'image/jpeg');
            });

            // 2. Get Presigned URL
            const filename = `selfie_${Date.now()}.jpg`;
            const uploadRes = await fetch(`http://localhost:8080/api/v1/sessions/upload-url?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content_type: 'image/jpeg' })
            });
            if (!uploadRes.ok) throw new Error('Failed to get upload URL');
            const { upload_url, file_key } = await uploadRes.json();

            // 3. Upload to MinIO (Direct PUT)
            const putRes = await fetch(upload_url, {
                method: 'PUT',
                body: blob,
                headers: { 'Content-Type': 'image/jpeg' }
            });
            if (!putRes.ok) throw new Error('Failed to upload image to storage');

            // 4. Submit Step
            await onComplete({ selfie: file_key });

        } catch (err) {
            console.error(err);
            alert("Upload failed: " + err.message);
            setUploading(false);
        }
    };

    return (
        <div style={styles.card}>
            <h2>Selfie Verification</h2>
            <p>Please take a selfie.</p>

            <div style={styles.placeholder}>
                [ FRONT CAMERA PREVIEW ]
            </div>

            <button
                style={{ ...styles.button, opacity: uploading ? 0.5 : 1 }}
                onClick={handleCapture}
                disabled={uploading}
            >
                {uploading ? 'Uploading...' : 'Take Selfie & Finish'}
            </button>
        </div>
    )
}

const styles = {
    card: {
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '8px',
        background: '#f9f9f9',
        maxWidth: '400px',
        margin: '0 auto'
    },
    placeholder: {
        width: '100%',
        height: '320px',
        background: '#333',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        borderRadius: '4px'
    },
    button: {
        width: '100%',
        padding: '12px 20px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    }
}

export default SelfieCapture
