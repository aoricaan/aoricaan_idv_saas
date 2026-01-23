import { useState } from 'react';

function DocumentCapture({ config, token, onComplete }) {
    const [uploading, setUploading] = useState(false);

    const handleCapture = async () => {
        setUploading(true);
        try {
            // 1. Create a dummy image blob (since we don't have a real camera yet)
            const blob = await new Promise(resolve => {
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, 640, 480);
                ctx.fillStyle = '#333';
                ctx.font = '30px Arial';
                ctx.fillText(`Front ID - ${new Date().toISOString()}`, 50, 240);
                canvas.toBlob(resolve, 'image/jpeg');
            });

            // 2. Get Presigned URL
            const filename = `front_${Date.now()}.jpg`;
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
            await onComplete({ document_front: file_key });

        } catch (err) {
            console.error(err);
            alert("Upload failed: " + err.message);
            setUploading(false); // Reset on error
        }
    };

    return (
        <div style={styles.card}>
            <h2>Document Capture ({config.side})</h2>
            <p>Please upload your {config.side} ID.</p>

            <div style={styles.placeholder}>
                [ CAMERA PREVIEW WOULD GO HERE ]
            </div>

            <button
                style={{ ...styles.button, opacity: uploading ? 0.5 : 1 }}
                onClick={handleCapture}
                disabled={uploading}
            >
                {uploading ? 'Uploading...' : 'Capture & Continue'}
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
        height: '240px',
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
        background: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    }
}

export default DocumentCapture
