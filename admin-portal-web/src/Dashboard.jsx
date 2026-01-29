import { useState, useEffect } from 'react';
import VerificationList from './components/VerificationList';
import VerificationDetail from './components/VerificationDetail';

export default function Dashboard({ token, onLogout }) {
    const [newKey, setNewKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [keyStatus, setKeyStatus] = useState(null);
    const [credits, setCredits] = useState({ balance: 0, transactions: [] });
    const [showTopUpModal, setShowTopUpModal] = useState(false);

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
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to rotate key');
            }
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

    const buyCredits = async (amount) => {
        setLoading(true);
        try {
            // Using existing endpoint to simulate purchase
            const res = await fetch('http://localhost:8080/admin/credits/add', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount, description: `Top-up via Portal (${amount} Credits)` })
            });
            if (!res.ok) throw new Error('Failed to purchase credits');
            await fetchCredits();
            setShowTopUpModal(false);
            alert("Purchase successful! (Simulated)");
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };



    const [view, setView] = useState('overview'); // 'overview', 'verifications', 'verification_detail'
    const [selectedSessionToken, setSelectedSessionToken] = useState(null);

    const renderContent = () => {
        switch (view) {
            case 'verifications':
                return <VerificationList token={token} onSelectSession={handleSelectSession} />;
            case 'verification_detail':
                return <VerificationDetail token={token} sessionToken={selectedSessionToken} onBack={() => setView('verifications')} />;
            default:
                return (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                    <button
                                        onClick={() => setShowTopUpModal(true)}
                                        className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 cursor-pointer"
                                    >
                                        + Buy Credits
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Transactions</h4>
                                    <button onClick={simulateUsage} disabled={loading || credits.balance <= 0} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 cursor-pointer disabled:opacity-50">
                                        Test Verification (-1)
                                    </button>
                                </div>
                                <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                    {(!credits.transactions || credits.transactions.length === 0) ? (
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
                );
        }
    };

    const handleSelectSession = (token) => {
        setSelectedSessionToken(token);
        setView('verification_detail');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600 mr-8 cursor-pointer" onClick={() => setView('overview')}>Aoricaan Admin</h1>

                            {/* Navigation Links */}
                            <div className="hidden md:flex space-x-4">
                                <button
                                    onClick={() => setView('overview')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${view === 'overview' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setView('verifications')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${view.startsWith('verification') ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Verifications
                                </button>
                            </div>
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
                <div className="px-4 py-6 sm:px-0">
                    {renderContent()}
                </div>

                {/* Top Up Modal */}
                {showTopUpModal && (
                    <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={() => setShowTopUpModal(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Top Up Credits</h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 mb-4">Select a package to top up your account instantly.</p>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {[100, 500, 1000].map(amount => (
                                                        <button
                                                            key={amount}
                                                            onClick={() => buyCredits(amount)}
                                                            disabled={loading}
                                                            className="flex justify-between items-center w-full px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                                                        >
                                                            <span>{amount} Credits</span>
                                                            <span className="font-bold text-gray-900">${(amount / 10).toFixed(2)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
                                        onClick={() => setShowTopUpModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

