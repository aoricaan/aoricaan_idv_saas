import React, { useEffect, useState } from 'react';
import StepTemplateModal from './StepTemplateModal';

export default function StepsPage() {
    const [templates, setTemplates] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const fetchTemplates = async () => {
        const token = localStorage.getItem('admin_token');
        const res = await fetch('http://localhost:8080/admin/step-templates', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setTemplates(await res.json());
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSave = async (data) => {
        const token = localStorage.getItem('admin_token');
        let url = 'http://localhost:8080/admin/step-templates';
        let method = 'POST';

        if (editingTemplate) {
            url += `?id=${editingTemplate.id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            setIsModalOpen(false);
            setEditingTemplate(null);
            fetchTemplates();
        } else {
            alert("Failed to save template");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`http://localhost:8080/admin/step-templates?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            fetchTemplates();
        } else {
            alert("Failed to delete template");
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Step Library</h1>
                <button
                    onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
                >
                    Create New Step
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map((t) => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.strategy === 'UI_STEP' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {t.strategy}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    {t.is_system ? (
                                        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">System</span>
                                    ) : (
                                        <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Custom</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {!t.is_system && (
                                        <>
                                            <button
                                                onClick={() => { setEditingTemplate(t); setIsModalOpen(true); }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    {t.is_system && <span className="text-gray-400 text-xs italic">Locked</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <StepTemplateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                template={editingTemplate}
            />
        </div>
    );
}
