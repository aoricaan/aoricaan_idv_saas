import { useState, useEffect } from 'react';

export default function Dashboard({ token, onLogout }) {
    const [newKey, setNewKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [keyStatus, setKeyStatus] = useState(null);
    const [credits, setCredits] = useState({ balance: 0, transactions: [] });

    useEffect(() => {
        fetchKeyStatus();
        fetchCredits();
    }, []);

    const fetchKeyStatus = async () => {
        try {
            const res = await fetch('http://localhost:8080/admin/api-key/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setKeyStatus(await res.json());
        } catch (err) {
            console.error("Failed to fetch key status", err);
        }
    };

    const fetchCredits = async () => {
        try {
            const res = await fetch('http://localhost:8080/admin/credits', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setCredits(await res.json());
        } catch (err) {
            console.error("Failed to fetch credits", err);
        }
    };

    const rotateKey = async () => {
        if (!confirm("Are you sure? This will invalidate the old API Key immediately.")) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/admin/api-key/rotate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Failed to rotate key');
            const data = await res.json();
            setNewKey(data.new_api_key);
            fetchKeyStatus();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const simulateUsage = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/admin/credits/simulate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to simulate usage');
            fetchCredits(); // Refresh balance
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
                            <button onClick={onLogout} className="ml-4 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0 grid grid-cols-1 gap-6 md:grid-cols-2">

                    {/* API Key Section */}
                    <div className="bg-white shadow rounded-lg p-6">
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
                            <div className="text-sm text-gray-500">Rotate key if compromised.</div>
                            <button onClick={rotateKey} disabled={loading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer disabled:opacity-50">
                                {loading ? '...' : 'Rotate Key'}
                            </button>
                        </div>
                        {newKey && (
                            <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                                <p className="text-sm text-green-700 font-bold mb-1">New Key Generated (Save it!):</p>
                                <code className="block p-2 bg-white rounded border border-green-200 font-mono break-all select-all">{newKey}</code>
                            </div>
                        )}
                    </div>

                    {/* Credits Section */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Prepaid Credits</h3>
                                <p className="text-sm text-gray-500 mt-1">Available balance for verifications.</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-gray-900">{credits.balance}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Credits</div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Transactions</h4>
                                <button onClick={simulateUsage} disabled={loading || credits.balance <= 0} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 cursor-pointer disabled:opacity-50">
                                    Test Verification (-1)
                                </button>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {credits.transactions.length === 0 ? (
                                    <li className="py-2 text-sm text-gray-400 italic">No transactions yet.</li>
                                ) : (
                                    credits.transactions.map((tx) => (
                                        <li key={tx.id} className="py-3 flex justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                                                <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                                            </div>
                                            <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </span>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

