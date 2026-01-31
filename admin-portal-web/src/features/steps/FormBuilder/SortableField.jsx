import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableField({ field, isSelected, onClick, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group relative mb-3 p-4 border rounded-md transition-all cursor-pointer bg-white
                ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md' : 'border-gray-200 hover:border-indigo-300'}
            `}
            onClick={(e) => {
                e.stopPropagation();
                onClick(field);
            }}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 pointer-events-none"> {/* Disable pointer events to prevent input interaction during drag design */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-400">
                        {field.placeholder || `Enter ${field.label}...`}
                    </div>
                    {/* Handle for Dragging - Specific area to grab so clicking doesn't always drag */}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                    <button
                        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                        {...attributes}
                        {...listeners} // Listeners only on this handle
                    >
                        🖐️
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(field.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="mt-2 text-xs text-gray-400 font-mono">
                ID: {field.id} | Type: {field.type}
            </div>
        </div>
    );
}
