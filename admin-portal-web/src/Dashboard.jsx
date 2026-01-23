import { useState, useEffect } from 'react';

export default function Dashboard({ token, onLogout }) {
    const [newKey, setNewKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [keyStatus, setKeyStatus] = useState(null);

    useEffect(() => {
        fetchKeyStatus();
    }, []);

    const fetchKeyStatus = async () => {
        try {
            const res = await fetch('http://localhost:8080/admin/api-key/status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setKeyStatus(data);
            }
        } catch (err) {
            console.error("Failed to fetch key status", err);
        }
    };

    const rotateKey = async () => {
        if (!confirm("Are you sure? This will invalidate the old API Key immediately.")) return;

        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/admin/api-key/rotate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!res.ok) throw new Error('Failed to rotate key');

            const data = await res.json();
            setNewKey(data.new_api_key);
            fetchKeyStatus(); // Refresh status
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800">Aoricaan Admin</h1>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={onLogout}
                                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

                    {/* API Key Section */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">API Key Management</h3>

                        {keyStatus && (
                            <div className="mb-4 flex items-center bg-gray-50 p-3 rounded border border-gray-200">
                                <div className="flex-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Key Status</span>
                                    <div className="text-sm font-mono text-gray-700 mt-1 flex items-center">
                                        <span className="bg-gray-200 px-2 py-1 rounded text-gray-600 mr-2 tracking-widest">{keyStatus.mask}</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 uppercase">
                                            {keyStatus.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                You can rotate your key if it's compromised. This action is irreversible.
                            </div>
                            <button
                                onClick={rotateKey}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? 'Rotating...' : 'Rotate API Key'}
                            </button>
                        </div>

                        {newKey && (
                            <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800">New API Key Generated</h3>
                                        <div className="mt-2 text-sm text-green-700">
                                            <p>Please copy this key immediately. You won't be able to see it again.</p>
                                            <code className="block mt-2 p-2 bg-white rounded border border-green-200 font-mono break-all select-all">
                                                {newKey}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
