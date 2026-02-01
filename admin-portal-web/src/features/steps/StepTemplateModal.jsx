import React, { useState, useEffect, useMemo } from 'react';
import FormBuilder from './FormBuilder/FormBuilder';
import CodeStepBuilder from './CodeStepBuilder/CodeStepBuilder';

export default function StepTemplateModal({ isOpen, onClose, onSave, template }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        strategy: 'UI_STEP', // Default
        base_config: '{}'
    });

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                description: template.description,
                strategy: template.strategy,
                base_config: JSON.stringify(template.base_config, null, 2)
            });
        } else {
            setFormData({
                name: '',
                description: '',
                strategy: 'UI_STEP',
                base_config: '{"fields": [], "actions": [{"type": "submit", "label": "Continue", "conditions": []}]}' // Default for new UI Step
            });
        }
    }, [template]);

    const handleFormBuilderChange = (newConfig) => {
        setFormData({
            ...formData,
            base_config: JSON.stringify(newConfig, null, 2)
        });
    };

    const parsedConfig = useMemo(() => {
        try {
            return JSON.parse(formData.base_config);
        } catch (e) {
            return { fields: [], actions: [] };
        }
    }, [formData.base_config]);

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            const config = JSON.parse(formData.base_config);
            onSave({
                ...formData,
                base_config: config
            });
        } catch (err) {
            alert("Invalid JSON in Base Configuration");
        }
    };

    const isUiStep = formData.strategy === 'UI_STEP';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className={`bg-white rounded-lg p-6 w-full ${isUiStep || formData.strategy === 'CODE_STEP' ? 'max-w-6xl' : 'max-w-lg'} shadow-xl max-h-[90vh] overflow-y-auto`}>
                <h2 className="text-xl font-bold mb-4">{template ? 'Edit Step' : 'Create New Step'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Strategy</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.strategy}
                                disabled={!!template} // Strategy immutable after creation usually
                                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                            >
                                <option value="UI_STEP">UI Step (Form)</option>
                                <option value="CODE_STEP">Code Step (API Integration)</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {isUiStep ? (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Form Builder</label>
                            <FormBuilder
                                config={parsedConfig}
                                onConfigChange={handleFormBuilderChange}
                            />
                            <div className="mt-2 text-xs text-gray-400">
                                <details>
                                    <summary className="cursor-pointer">View Generated JSON</summary>
                                    <pre className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 overflow-x-auto">
                                        {formData.base_config}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    ) : formData.strategy === 'CODE_STEP' ? (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Code Step Configuration</label>
                            <CodeStepBuilder
                                config={parsedConfig}
                                onConfigChange={handleFormBuilderChange}
                            />
                            <div className="mt-2 text-xs text-gray-400">
                                <details>
                                    <summary className="cursor-pointer">View Generated JSON</summary>
                                    <pre className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 overflow-x-auto">
                                        {formData.base_config}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700">
                                Base Configuration (JSON)
                                <span className="text-xs text-gray-500 ml-2">(e.g. endpoint, method)</span>
                            </label>
                            <textarea
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border font-mono text-sm"
                                rows={10}
                                value={formData.base_config}
                                onChange={(e) => setFormData({ ...formData, base_config: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Step</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

