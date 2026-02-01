import React, { useState, useEffect } from 'react';

// Icons (Simple SVGs)
const Icons = {
    General: () => <span className="mr-2">📝</span>,
    Params: () => <span className="mr-2">🔗</span>,
    Headers: () => <span className="mr-2">🛡️</span>,
    Body: () => <span className="mr-2">📦</span>,
    Trash: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

export default function CodeStepBuilder({ config, onConfigChange }) {
    const defaultConfig = {
        endpoint: '',
        method: 'GET',
        inputs: [],
        outputs: [],
        path_params: [],
        query_params: [],
        headers: [],
        body_structure: []
    };

    const [localConfig, setLocalConfig] = useState(config && Object.keys(config).length > 0 ? config : defaultConfig);
    const [activeTab, setActiveTab] = useState('params');

    useEffect(() => {
        if (config) {
            setLocalConfig(curr => {
                if (JSON.stringify(config) !== JSON.stringify(curr)) {
                    return { ...defaultConfig, ...config }; // Merge to ensure all arrays exist
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

    // Render Helpers
    const renderListBuilder = (title, listKey, fields, addButtonLabel = "+ Add Item") => {
        const list = localConfig[listKey] || [];
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-700">{title}</h3>
                    <button
                        type="button"
                        onClick={() => {
                            const newItem = {};
                            fields.forEach(f => newItem[f.key] = f.default);
                            addListItem(listKey, newItem);
                        }}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-medium"
                    >
                        {addButtonLabel}
                    </button>
                </div>

                <div className="space-y-2">
                    {list.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-2 bg-gray-50 p-2 rounded border border-gray-100">
                            {fields.map((field) => (
                                <div key={field.key} className={`${field.width || 'flex-1'}`}>
                                    {field.type === 'select' ? (
                                        <select
                                            value={item[field.key]}
                                            onChange={(e) => updateListItem(listKey, idx, field.key, e.target.value)}
                                            className="w-full text-xs border-gray-300 rounded"
                                        >
                                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : field.type === 'checkbox' ? (
                                        <label className="flex items-center text-xs text-gray-600 mt-2">
                                            <input
                                                type="checkbox"
                                                checked={item[field.key]}
                                                onChange={(e) => updateListItem(listKey, idx, field.key, e.target.checked)}
                                                className="mr-1 h-3 w-3"
                                            />
                                            {field.label}
                                        </label>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder={field.placeholder}
                                            value={item[field.key]}
                                            onChange={(e) => updateListItem(listKey, idx, field.key, e.target.value)}
                                            className="w-full text-xs border-gray-300 rounded"
                                        />
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => removeListItem(listKey, idx)}
                                className="text-gray-400 hover:text-red-500 pt-1"
                            >
                                <Icons.Trash />
                            </button>
                        </div>
                    ))}
                    {list.length === 0 && (
                        <p className="text-xs text-gray-400 text-center italic py-2">No items defined.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* HTTP Request Config - Always Visible */}
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

            {/* Tabs Navigation */}
            <div className="flex space-x-1 border-b border-gray-200">
                {['Params', 'Body', 'Headers'].map((tab) => {
                    const isActive = activeTab === tab.toLowerCase();
                    return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center ${isActive
                                ? 'bg-white border-x border-t border-gray-200 text-indigo-600'
                                : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <Icons.General /> {/* Helper just for demo, real icon logic below */}
                            {tab === 'Params' && <Icons.Params />}
                            {tab === 'Body' && <Icons.Body />}
                            {tab === 'Headers' && <Icons.Headers />}
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="p-1">


                {activeTab === 'params' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderListBuilder("Path Parameters", "path_params", [
                                { key: 'key', placeholder: 'Path Key (e.g. id)', default: '' },
                                { key: 'description', placeholder: 'Description', default: '' }
                            ], "+ Add Path Param")}

                            {renderListBuilder("Query Parameters", "query_params", [
                                { key: 'key', placeholder: 'Query Key (e.g. api_version)', default: '' },
                                { key: 'value', placeholder: 'Static Value (optional)', default: '' }
                            ], "+ Add Query Param")}
                        </div>
                    </div>
                )}

                {activeTab === 'headers' && (
                    <div className="space-y-6">
                        {renderListBuilder("Security & Custom Headers", "headers", [
                            { key: 'key', placeholder: 'Header Name (e.g. Authorization)', default: '' },
                            { key: 'value', placeholder: 'Value (e.g. Bearer {token})', default: '' }
                        ], "+ Add Header")}
                        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                            <p><strong>Tip:</strong> You can use <code>{'{variable_name}'}</code> syntax in values to inject dynamic data from previous steps.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'body' && (
                    <div className="space-y-6">
                        {renderListBuilder("Request Body Structure (JSON)", "body_structure", [
                            { key: 'key', placeholder: 'Field Name', default: '' },
                            { key: 'type', type: 'select', options: ['string', 'number', 'boolean', 'object', 'array'], default: 'string', width: 'w-24' },
                            { key: 'value', placeholder: 'Value Mapping (e.g. {input.doc_id})', default: '' }
                        ], "+ Add Body Field")}
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <span>Configuration Mode: {activeTab.toUpperCase()}</span>
            </div>
        </div>
    );
}
