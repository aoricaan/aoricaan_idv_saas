import React, { useState, useEffect } from 'react';

export default function CodeStepBuilder({ config, onConfigChange }) {
    // Default structure if empty
    const defaultConfig = {
        endpoint: '',
        method: 'GET',
        inputs: [],
        outputs: []
    };

    // State for the form, initialized from props
    // We treat this as a controlled component wrapper around the JSON config
    const [localConfig, setLocalConfig] = useState(config && Object.keys(config).length > 0 ? config : defaultConfig);

    useEffect(() => {
        if (config) {
            setLocalConfig(curr => {
                // simple deep comparison check could go here, but for now just sync if different keys
                // to avoid loops if onConfigChange creates new object references
                if (JSON.stringify(config) !== JSON.stringify(curr)) {
                    return config;
                }
                return curr;
            });
        }
    }, [config]);

    const update = (newData) => {
        const newConfig = { ...localConfig, ...newData };
        setLocalConfig(newConfig);
        onConfigChange(newConfig);
    };

    // Helper for List Builders
    const addListItem = (listKey, item) => {
        const list = localConfig[listKey] || [];
        update({ [listKey]: [...list, item] });
    };

    const removeListItem = (listKey, index) => {
        const list = localConfig[listKey] || [];
        const newList = [...list];
        newList.splice(index, 1);
        update({ [listKey]: newList });
    };

    const updateListItem = (listKey, index, field, value) => {
        const list = localConfig[listKey] || [];
        const newList = [...list];
        newList[index] = { ...newList[index], [field]: value };
        update({ [listKey]: newList });
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">HTTP Request</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                        <select
                            value={localConfig.method || 'GET'}
                            onChange={(e) => update({ method: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Endpoint URL</label>
                        <input
                            type="text"
                            value={localConfig.endpoint || ''}
                            onChange={(e) => update({ endpoint: e.target.value })}
                            placeholder="https://api.example.com/check"
                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border font-mono"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs Definitions */}
                <div className="bg-white border boundary-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-700">Expected Inputs</h3>
                        <button
                            type="button"
                            onClick={() => addListItem('inputs', { key: '', type: 'string', required: true })}
                            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-medium"
                        >
                            + Add Input
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(localConfig.inputs || []).map((input, idx) => (
                            <div key={idx} className="flex items-start space-x-2 bg-gray-50 p-2 rounded border border-gray-100">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Key (e.g. user_id)"
                                        value={input.key}
                                        onChange={(e) => updateListItem('inputs', idx, 'key', e.target.value)}
                                        className="w-full text-xs border-gray-300 rounded"
                                    />
                                    <div className="flex space-x-2">
                                        <select
                                            value={input.type}
                                            onChange={(e) => updateListItem('inputs', idx, 'type', e.target.value)}
                                            className="text-xs border-gray-300 rounded flex-1"
                                        >
                                            <option value="string">String</option>
                                            <option value="number">Number</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="object">Object</option>
                                        </select>
                                        <label className="flex items-center text-xs text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={input.required}
                                                onChange={(e) => updateListItem('inputs', idx, 'required', e.target.checked)}
                                                className="mr-1 h-3 w-3"
                                            />
                                            Rqrd
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeListItem('inputs', idx)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {(localConfig.inputs || []).length === 0 && (
                            <p className="text-xs text-gray-400 text-center italic py-4">No inputs defined.</p>
                        )}
                    </div>
                </div>

                {/* Outputs Definitions */}
                <div className="bg-white border boundary-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-700">Outputs</h3>
                        <button
                            type="button"
                            onClick={() => addListItem('outputs', { key: '', type: 'string', description: '' })}
                            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-medium"
                        >
                            + Add Output
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(localConfig.outputs || []).map((output, idx) => (
                            <div key={idx} className="flex items-start space-x-2 bg-gray-50 p-2 rounded border border-gray-100">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Key (e.g. risk_score)"
                                        value={output.key}
                                        onChange={(e) => updateListItem('outputs', idx, 'key', e.target.value)}
                                        className="w-full text-xs border-gray-300 rounded"
                                    />
                                    <select
                                        value={output.type}
                                        onChange={(e) => updateListItem('outputs', idx, 'type', e.target.value)}
                                        className="w-full text-xs border-gray-300 rounded"
                                    >
                                        <option value="string">String</option>
                                        <option value="number">Number</option>
                                        <option value="boolean">Boolean</option>
                                        <option value="object">Object</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeListItem('outputs', idx)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {(localConfig.outputs || []).length === 0 && (
                            <p className="text-xs text-gray-400 text-center italic py-4">No outputs defined.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
                <p>This definition helps the Workflow Engine validate data passing between steps.</p>
            </div>
        </div>
    );
}
