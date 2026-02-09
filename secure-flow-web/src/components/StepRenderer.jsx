import { useEffect } from 'react'
import DocumentCapture from './DocumentCapture'
import SelfieCapture from './SelfieCapture'
import DynamicForm from './DynamicForm'

function StepRenderer({ step, token, onStepComplete }) {
    if (!step) return <div>Loading step...</div>

    // 1. Handle Legacy Hardcoded Types
    if (step.type === 'document_capture') {
        return <DocumentCapture config={step.config} token={token} onComplete={onStepComplete} />
    }
    if (step.type === 'selfie') {
        return <SelfieCapture config={step.config} token={token} onComplete={onStepComplete} />
    }

    // 2. Handle Strategies
    if (step.strategy === 'CODE_STEP') {
        // Auto-advance
        useEffect(() => {
            const timer = setTimeout(() => {
                onStepComplete({}); // Submit empty data to trigger backend execution
            }, 1000); // Small delay for UX
            return () => clearTimeout(timer);
        }, [onStepComplete]);

        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600">Processing step...</p>
            </div>
        )
    }

    if (step.strategy === 'UI_STEP') {
        return <DynamicForm config={step.base_config} onComplete={onStepComplete} />
    }

    return <div style={{ color: 'red' }}>Unknown Step Type: {step.type} ({step.strategy})</div>
}

export default StepRenderer
