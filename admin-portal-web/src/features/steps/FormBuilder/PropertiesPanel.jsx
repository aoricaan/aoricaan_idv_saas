import React, { useState, useEffect } from 'react';

export default function PropertiesPanel({ selectedField, onUpdateField, formActions, onUpdateActions, allFields }) {
    if (!selectedField && !formActions) {
        return (
            <div className="w-72 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-gray-400 text-center">
                <span className="text-4xl mb-4">⚙️</span>
                <p className="text-sm">Select an element on the canvas to edit its properties.</p>

                <div className="mt-8 w-full border-t pt-4 text-left">
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Global Actions</h4>
                    <button
                        type="button"
                        onClick={() => onUpdateActions('select')} // trigger action edit
                        className="mt-2 text-indigo-600 text-sm hover:underline cursor-pointer"
                    >
                        Edit Submit Button
                    </button>
                </div>
            </div>
        );
    }

    if (!selectedField) {
        // Editing Actions (Submit Button)
        return (
            <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-800">Button Properties</h3>
                    <button type="button" onClick={() => onUpdateActions('close')} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                        <input
                            type="text"
                            value={formActions[0]?.label || 'Continue'}
                            onChange={(e) => {
                                const newActions = [...formActions];
                                if (!newActions[0]) newActions[0] = { type: 'submit' };
                                newActions[0].label = e.target.value;
                                onUpdateActions(newActions);
                            }}
                            className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Conditions (AND)</label>
                        <p className="text-xs text-gray-400 mb-2">Button is enabled only if:</p>

                        {formActions[0]?.conditions?.map((cond, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded mb-2 border border-gray-200 relative">
                                <div className="text-xs font-mono mb-1">{cond.field}</div>
                                <div className="text-xs text-indigo-600">{cond.operator}</div>
                                <div className="text-xs text-indigo-600">{cond.operator}</div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newActions = [...formActions];
                                        newActions[0].conditions.splice(idx, 1);
                                        onUpdateActions(newActions);
                                    }}
                                    className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                                >✕</button>
                            </div>
                        ))}

                        {/* Simple Add Condition UI */}
                        <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-100">
                            <div className="mb-2">
                                <select id="new-cond-field" className="w-full text-xs border-gray-300 rounded mb-1">
                                    <option value="">Select Field</option>
                                    {allFields.map(f => (
                                        <option key={f.id} value={f.id}>{f.label}</option>
                                    ))}
                                </select>
                                <select id="new-cond-op" className="w-full text-xs border-gray-300 rounded">
                                    <option value="not_empty">Not Empty</option>
                                    <option value="is_true">Is Checked (True)</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const field = document.getElementById('new-cond-field').value;
                                    const op = document.getElementById('new-cond-op').value;
                                    if (!field) return;

                                    const newActions = [...formActions];
                                    if (!newActions[0]) newActions[0] = { type: 'submit', label: 'Continue', conditions: [] };
                                    if (!newActions[0].conditions) newActions[0].conditions = [];

                                    newActions[0].conditions.push({ field, operator: op });
                                    onUpdateActions(newActions);
                                }}
                                className="w-full bg-indigo-600 text-white text-xs py-1 rounded hover:bg-indigo-700"
                            >
                                Add Condition
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800">Properties</h3>
                <button type="button" onClick={() => onUpdateField(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Field ID (Key)</label>
                    <input
                        type="text"
                        value={selectedField.id}
                        onChange={(e) => onUpdateField({ ...selectedField, id: e.target.value })}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-gray-50"
                    />
                    <p className="text-xs text-gray-400 mt-1">Unique key for data storage.</p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                    <input
                        type="text"
                        value={selectedField.label}
                        onChange={(e) => onUpdateField({ ...selectedField, label: e.target.value })}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {selectedField.type !== 'checkbox' && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Placeholder</label>
                        <input
                            type="text"
                            value={selectedField.placeholder || ''}
                            onChange={(e) => onUpdateField({ ...selectedField, placeholder: e.target.value })}
                            className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                )}

                <div className="flex items-center mt-4">
                    <input
                        id="required-checkbox"
                        type="checkbox"
                        checked={selectedField.required || false}
                        onChange={(e) => onUpdateField({ ...selectedField, required: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="required-checkbox" className="ml-2 block text-sm text-gray-900">
                        Required
                    </label>
                </div>
            </div>
        </div>
    );
}
