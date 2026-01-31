import React, { useState, useEffect } from 'react';

export default function StepConfigurationPanel({ selectedNode, onUpdateNode, onClose }) {
    const [config, setConfig] = useState({});

    useEffect(() => {
        if (selectedNode) {
            setConfig(selectedNode.data.config || {});
        }
    }, [selectedNode]);

    if (!selectedNode) return null;

    const { data } = selectedNode;
    const isSystem = data.is_system;

    const handleConfigChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onUpdateNode(selectedNode.id, { ...data, config: newConfig });
    };

    return (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg border-l border-gray-200 p-4 overflow-y-auto z-10 transition-transform transform translate-x-0">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Configuration</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Step Type</label>
                <div className="mt-1 flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${data.strategy === 'UI_STEP' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                        {data.strategy}
                    </span>
                    <span className="ml-2 text-sm text-gray-900 font-medium">{data.label}</span>
                </div>
            </div>

            {isSystem && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>System Step:</strong> Core configuration is managed by the platform. You can only map inputs.
                </div>
            )}

            {data.strategy === 'CODE_STEP' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Endpoint</label>
                        <input
                            type="text"
                            value={config.endpoint || ''}
                            disabled={isSystem}
                            onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border ${isSystem ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>
            )}

            {data.strategy === 'UI_STEP' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">UI configuration requires Form Builder implementation (Pending).</p>
                </div>
            )}

            <div className="mt-8 border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Input Mapping</h4>
                <p className="text-xs text-gray-500 mb-2">Pass data from the global context to this step.</p>
                {/* Placeholder for Input Mapping UI */}
                <div className="p-2 border border-dashed border-gray-300 rounded text-center text-xs text-gray-400">
                    Input Mapping Controls Here
                </div>
            </div>
        </div>
    );
}
