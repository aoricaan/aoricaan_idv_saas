import DocumentCapture from './DocumentCapture'
import SelfieCapture from './SelfieCapture'

function StepRenderer({ step, token, onStepComplete }) {
    if (!step) return <div>Loading step...</div>

    switch (step.type) {
        case 'document_capture':
            return <DocumentCapture config={step.config} token={token} onComplete={onStepComplete} />

        case 'selfie':
            return <SelfieCapture config={step.config} token={token} onComplete={onStepComplete} />

        default:
            return <div style={{ color: 'red' }}>Unknown Step Type: {step.type}</div>
    }
}

export default StepRenderer
