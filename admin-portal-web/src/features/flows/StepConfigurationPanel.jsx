import React, { useState, useEffect, useMemo } from 'react';

// Helper to render a generic input field for mapping
const MappingInput = ({ label, value, onChange, placeholder, required, description }) => (
    <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-xs border-gray-300 rounded font-mono bg-gray-50 focus:bg-white transition-colors"
        />
        {description && <p className="text-[10px] text-gray-400 mt-1">{description}</p>}
    </div>
);

export default function StepConfigurationPanel({ selectedNode, onUpdateNode, onClose }) {
    const [config, setConfig] = useState({});

    // Sync local state with node data
    useEffect(() => {
        if (selectedNode) {
            setConfig(selectedNode.data.config || {});
        }
    }, [selectedNode]);

    if (!selectedNode) return null;

    const { data } = selectedNode;
    const isSystem = data.is_system;

    // Ensure base_config is an object
    const templateConfig = useMemo(() => {
        if (typeof data.base_config === 'string') {
            try {
                return JSON.parse(data.base_config);
            } catch (e) {
                return {};
            }
        }
        return data.base_config || {};
    }, [data.base_config]);

    const handleConfigChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onUpdateNode(selectedNode.id, { ...data, config: newConfig });
    };

    // Helper to render dynamic sections
    const renderDynamicSection = (title, items, configPrefix = '') => {
        if (!items || items.length === 0) return null;

        return (
            <div className="mb-6 border-b border-gray-100 pb-4 last:border-0">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
                {items.map((item, idx) => {
                    const configKey = configPrefix ? `${configPrefix}.${item.key}` : item.key;
                    // For flat config structure (simplest for now): just use the key unique to the list? 
                    // Risk of collision if same key in inputs vs params. 
                    // Let's use a convention for storage: "inputs.userId", "headers.Auth". 
                    // OR, keep it simple and assume keys are unique enough or use prefixes.
                    // Implementation Plan implied direct mapping. Let's use robust namespacing:

                    // Actually, for simplicity and backward compatibility, let's prefix in the storage key.
                    // inputs -> inputs:key (or just key if unique)

                    // Revised Strategy: Store flat but unique keys. 
                    // Better: Store nested? Node data config is usually flat map [string]string.
                    // Let's use prefixing for clarity: "input_user_id", "header_Authorization".
                    // Wait, the template editor defined keys like "user_id". 
                    // If we use prefixes, the Code Step execution logic needs to know about them.

                    // Let's just use the raw key defined in the template for now, 
                    // assuming the user defines unique keys. If collisions occur, last one wins.
                    // A better approach for the future is nested config objects.
                    // For THIS iteration: Direct Key Mapping.

                    return (
                        <MappingInput
                            key={idx}
                            label={item.key}
                            required={item.required}
                            description={item.description || `Type: ${item.type}`}
                            placeholder={`Value for ${item.key}`}
                            value={config[item.key]}
                            onChange={(val) => handleConfigChange(item.key, val)}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg border-l border-gray-200 p-4 overflow-y-auto z-10 transition-transform transform translate-x-0 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Configuration</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Header Info */}
            <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${data.strategy === 'UI_STEP' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                        {data.strategy}
                    </span>
                    <h4 className="font-medium text-gray-900 truncate">{data.label}</h4>
                </div>
                {templateConfig.method && (
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-100 break-all">
                        <span className="font-bold text-gray-700">{templateConfig.method}</span> {templateConfig.endpoint}
                    </div>
                )}
            </div>

            {/* Dynamic Configuration Area */}
            <div className="flex-1 overflow-y-auto pr-1">
                {isSystem && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <strong>System Step:</strong> Core configuration is locked. Map the required inputs below.
                    </div>
                )}

                {data.strategy === 'CODE_STEP' && (
                    <>
                        {templateConfig.inputs?.length === 0 &&
                            templateConfig.path_params?.length === 0 &&
                            templateConfig.query_params?.length === 0 &&
                            templateConfig.headers?.length === 0 && (
                                <p className="text-sm text-gray-400 italic text-center py-4">No variable inputs defined for this step.</p>
                            )}

                        {renderDynamicSection("Path Parameters", templateConfig.path_params)}
                        {renderDynamicSection("Query Parameters", templateConfig.query_params)}
                        {renderDynamicSection("Inputs (Context)", templateConfig.inputs)}
                        {renderDynamicSection("Headers", templateConfig.headers)}
                        {renderDynamicSection("Body Fields", templateConfig.body_structure)}
                    </>
                )}

                {data.strategy === 'UI_STEP' && (
                    <div className="text-center py-10">
                        <span className="text-2xl block mb-2">🎨</span>
                        <p className="text-sm text-gray-500">
                            UI Steps are interactive. <br />
                            <span className="text-xs">Context mapping for pre-filling fields is coming soon.</span>
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-[10px] text-gray-400">
                    <p><strong>Tip:</strong> Use <code>{'{{context.variable}}'}</code> to map dynamic flow data.</p>
                </div>
            </div>
        </div>
    );
}
