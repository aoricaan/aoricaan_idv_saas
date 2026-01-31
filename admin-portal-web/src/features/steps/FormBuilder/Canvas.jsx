import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableField from './SortableField';

export default function Canvas({ fields, selectedFieldId, onSelectField, onDeleteField }) {
    const { setNodeRef } = useDroppable({
        id: 'canvas-droppable',
    });

    return (
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
            <div
                ref={setNodeRef}
                className="max-w-md mx-auto min-h-[500px] bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col"
            >
                <div className="mb-4 pb-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Preview</h2>
                    <span className="text-xs text-gray-400">Drag items here</span>
                </div>

                <div className="flex-1 space-y-3">
                    <SortableContext
                        items={fields.map(f => f.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {fields.length === 0 ? (
                            <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400">
                                <span className="text-2xl mb-2">👋</span>
                                <p className="text-sm">Drop form components here</p>
                            </div>
                        ) : (
                            fields.map((field) => (
                                <SortableField
                                    key={field.id}
                                    field={field}
                                    isSelected={selectedFieldId === field.id}
                                    onClick={onSelectField}
                                    onDelete={onDeleteField}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>

                {/* Visual Footer/Action Area */}
                <div className="mt-8 pt-4 border-t border-gray-100">
                    <button className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium opacity-50 cursor-not-allowed">
                        Continue (Configured in Properties)
                    </button>
                </div>
            </div>
        </div>
    );
}
