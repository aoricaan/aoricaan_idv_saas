import React from 'react';

export default function Sidebar() {
    const onDragStart = (event, nodeType, label) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Available Steps</h3>

            <div className="space-y-3">
                <div
                    className="p-3 bg-indigo-50 border border-indigo-200 rounded cursor-move hover:bg-indigo-100 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'stepNode', 'Document Scan')}
                    draggable
                >
                    <div className="text-sm font-medium text-indigo-900">Document Scan</div>
                    <div className="text-xs text-indigo-700">Scan ID document</div>
                </div>

                <div
                    className="p-3 bg-blue-50 border border-blue-200 rounded cursor-move hover:bg-blue-100 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'stepNode', 'Selfie Capture')}
                    draggable
                >
                    <div className="text-sm font-medium text-blue-900">Selfie Capture</div>
                    <div className="text-xs text-blue-700">Capture user selfie</div>
                </div>

                <div
                    className="p-3 bg-green-50 border border-green-200 rounded cursor-move hover:bg-green-100 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'stepNode', 'Face Match')}
                    draggable
                >
                    <div className="text-sm font-medium text-green-900">Face Match</div>
                    <div className="text-xs text-green-700">Compare ID with Selfie</div>
                </div>

                <div
                    className="p-3 bg-gray-50 border border-gray-200 rounded cursor-move hover:bg-gray-100 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'stepNode', 'Instructions')}
                    draggable
                >
                    <div className="text-sm font-medium text-gray-900">Instructions</div>
                    <div className="text-xs text-gray-700">Show text to user</div>
                </div>
            </div>

            <div className="mt-auto text-xs text-gray-400">
                Drag items to the canvas to build your flow.
            </div>
        </div>
    );
}
