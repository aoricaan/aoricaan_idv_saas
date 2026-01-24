import { useState, useEffect } from 'react';

export default function VerificationList({ token, onSelectSession }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            try {
                const query = search ? `?search=${encodeURIComponent(search)}` : '';
                const res = await fetch(`http://localhost:8080/admin/sessions${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch sessions');
                const data = await res.json();
                setSessions(data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        // Debounce simple
        const timeoutId = setTimeout(() => {
            fetchSessions();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [token, search]);

    const getStatusBadge = (status) => {
        const normalizedStatus = status.toLowerCase();
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'review_required': 'bg-blue-100 text-blue-800'
        };
        const colorClass = colors[normalizedStatus] || 'bg-gray-100 text-gray-800';
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${colorClass}`}>
                {status}
            </span>
        );
    };

    if (loading) return <div className="p-4 text-center">Loading sessions...</div>;
    if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Verifications</h3>
                    <span className="text-sm text-gray-500">{sessions.length} results</span>
                </div>
                <input
                    type="text"
                    placeholder="Search by User Reference..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {sessions.length === 0 ? (
                        <li className="px-4 py-4 text-sm text-gray-500 text-center">No sessions found.</li>
                    ) : (
                        sessions.map((session) => (
                            <li key={session.token} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectSession(session.token)}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-indigo-600 truncate">
                                            {session.user_reference}
                                        </div>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            {getStatusBadge(session.status)}
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                Flow ID: <span className="ml-1 font-mono text-xs">{session.flow_id}</span>
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>
                                                Created on <time dateTime={session.created_at}>{new Date(session.created_at).toLocaleDateString()}</time>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
