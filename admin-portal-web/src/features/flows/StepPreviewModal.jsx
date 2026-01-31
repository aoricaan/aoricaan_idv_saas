export default function StepPreviewModal({ stepType, config, onClose }) {
    if (!stepType) return null;

    const renderContent = () => {
        switch (stepType) {
            case 'document_scan':
                return (
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <p className="text-gray-600 font-medium">Scan your ID Document</p>
                        <p className="text-sm text-gray-500 mt-2">Place your ID within the frame</p>
                    </div>
                );
            case 'selfie_capture':
                return (
                    <div className="relative flex flex-col items-center justify-center p-8 bg-black rounded-lg h-64">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 rounded-full border-4 border-white opacity-50"></div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-white mt-4 z-10">Take a Selfie</p>
                    </div>
                );
            case 'face_match':
                return (
                    <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex space-x-4 mb-4">
                            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">ID</div>
                            <div className="text-green-500 font-bold">vs</div>
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xs">Selfie</div>
                        </div>
                        <p className="text-green-800 font-medium">Verifying Identity...</p>
                        <p className="text-xs text-green-600 text-center mt-1">Comparing document photo with selfie.</p>
                    </div>
                );
            case 'instructions':
                return (
                    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{config?.title || 'Instructions'}</h3>
                        <p className="text-gray-600">{config?.text || 'Please follow the steps on the screen to verify your identity.'}</p>
                        <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded text-sm">Continue</button>
                    </div>
                );
            default:
                return <div className="p-4 text-gray-500">Preview not available for this step type.</div>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Preview: {stepType.replace('_', ' ')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
                    <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">Close Preview</button>
                </div>
            </div>
        </div>
    );
}
