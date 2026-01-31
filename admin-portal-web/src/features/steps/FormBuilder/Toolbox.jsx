import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export const TOOLBOX_ITEMS = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'number', label: 'Number Input', icon: '🔢' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'select', label: 'Dropdown', icon: '🔽' },
    { type: 'display', label: 'Display Text', icon: '📄' },
];

function DraggableItem({ item }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `toolbox-${item.type}`,
        data: {
            isToolboxItem: true,
            type: item.type,
            label: item.label
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        cursor: 'grabbing',
        opacity: 0.8,
        zIndex: 1000,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm mb-2 cursor-grab hover:bg-gray-50 hover:border-indigo-300 transition-colors"
        >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
        </div>
    );
}

export default function Toolbox() {
    return (
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col h-full">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Components</h3>
            <div className="flex-1 overflow-y-auto">
                {TOOLBOX_ITEMS.map((item) => (
                    <DraggableItem key={item.type} item={item} />
                ))}
            </div>
        </div>
    );
}
