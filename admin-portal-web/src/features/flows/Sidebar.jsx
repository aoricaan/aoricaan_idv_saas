import React, { useEffect, useState } from 'react';

export default function Sidebar() {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                if (!token) return;

                const response = await fetch('http://localhost:8080/admin/step-templates', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data || []);
                }
            } catch (error) {
                console.error("Failed to load step templates", error);
            }
        };

        fetchTemplates();
    }, []);

    const onDragStart = (event, nodeType, label, template) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/label', label);
        event.dataTransfer.setData('application/template', JSON.stringify(template));
        event.dataTransfer.effectAllowed = 'move';
    };

    const getColors = (strategy) => {
        if (strategy === 'UI_STEP') return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', sub: 'text-indigo-700' };
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', sub: 'text-green-700' };
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Available Steps</h3>

            <div className="space-y-3">
                {templates.map(t => {
                    const colors = getColors(t.strategy);
                    return (
                        <div
                            key={t.id}
                            className={`p-3 ${colors.bg} border ${colors.border} rounded cursor-move hover:opacity-80 transition-opacity`}
                            onDragStart={(event) => onDragStart(event, 'stepNode', t.name, t)}
                            draggable
                        >
                            <div className={`text-sm font-medium ${colors.text}`}>{t.name}</div>
                            <div className={`text-xs ${colors.sub}`}>{t.description}</div>
                            <div className="text-[10px] uppercase mt-1 text-gray-500">{t.strategy.replace('_', ' ')}</div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-auto text-xs text-gray-400">
                Drag items to the canvas to build your flow.
            </div>
        </div>
    );
}
