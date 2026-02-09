import React, { useState } from 'react';

export default function DynamicForm({ config, onComplete }) {
    const fields = config?.fields || [];
    const actions = config?.actions || [{ type: 'submit', label: 'Continue', conditions: [] }];

    // Initialize state
    const [formData, setFormData] = useState({});

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onComplete(formData);
    };

    if (!fields.length) {
        return <div className="text-gray-500 text-center py-4">No fields to display.</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map(field => {
                switch (field.type) {
                    case 'text':
                    case 'number':
                    case 'email':
                    case 'password':
                        return (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <input
                                    type={field.type}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    value={formData[field.id] || ''}
                                    onChange={e => handleChange(field.id, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                />
                            </div>
                        );

                    case 'checkbox':
                        return (
                            <div key={field.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={field.id}
                                    required={field.required}
                                    checked={!!formData[field.id]}
                                    onChange={e => handleChange(field.id, e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor={field.id} className="ml-2 block text-sm text-gray-900">
                                    {field.label}
                                </label>
                            </div>
                        );

                    case 'select':
                        return (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <select
                                    required={field.required}
                                    value={formData[field.id] || ''}
                                    onChange={e => handleChange(field.id, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                >
                                    <option value="">Select...</option>
                                    {(field.options || []).map((opt, idx) => {
                                        const val = typeof opt === 'object' ? opt.value : opt;
                                        const lab = typeof opt === 'object' ? opt.label : opt;
                                        return <option key={idx} value={val}>{lab}</option>
                                    })}
                                </select>
                            </div>
                        );

                    case 'display':
                        return (
                            <div key={field.id} className="prose text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
                                {field.label}
                            </div>
                        );

                    default:
                        // Fallback for unknown types or just renders label
                        return (
                            <div key={field.id} className="text-red-500 text-xs">
                                Unknown field type: {field.type}
                            </div>
                        );
                }
            })}

            <div className="pt-4 border-t border-gray-100 mt-6">
                {(actions && actions.length > 0 ? actions : [{ label: 'Submit' }]).map((action, idx) => (
                    <button
                        key={idx}
                        type="submit" // For now, assumed submit
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        {action.label || 'Submit'}
                    </button>
                ))}
            </div>
        </form>
    );
}
