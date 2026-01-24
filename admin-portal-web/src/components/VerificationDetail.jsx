import { useState, useEffect } from 'react';

export default function VerificationDetail({ token, sessionToken, onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`http://localhost:8080/admin/sessions/detail?token=${sessionToken}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch session details');
                setData(await res.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [token, sessionToken]);

    const handleDecision = async (status) => {
        if (!confirm(`Are you sure you want to ${status.toUpperCase()} this verification?`)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/admin/sessions/decision?token=${sessionToken}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, reason: "Manual admin review" })
            });

            if (!res.ok) throw new Error('Failed to submit decision');

            // Go back to list on success
            onBack();
        } catch (err) {
            alert(err.message);
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!data) return null;

    const { session, images } = data;

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Header */}
            <div className="px-4 py-5 sm:px-6 items-center flex justify-between border-b border-gray-200">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Verification Review
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Reference: {session.user_reference}
                    </p>
                </div>
                <button onClick={onBack} className="text-sm text-indigo-600 hover:text-indigo-900 cursor-pointer">
                    &larr; Back to List
                </button>
            </div>

            {/* Images Grid */}
            <div className="bg-gray-50 px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Front ID */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Front ID</h4>
                        <div className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden border border-gray-300 shadow-sm flex items-center justify-center">
                            {images?.document_front ? (
                                <img
                                    src={images.document_front}
                                    alt="Front Document"
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <span className="text-gray-400 text-sm">No Image</span>
                            )}
                        </div>
                    </div>

                    {/* Selfie */}
                    {/* Add null check specifically for images object */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Selfie</h4>
                        <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden border border-gray-300 shadow-sm flex items-center justify-center relative">
                            {images?.selfie ? (
                                <img
                                    src={images.selfie}
                                    alt="Selfie"
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <span className="text-gray-400 text-sm">No Image</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Data & Actions */}
            <div className="px-4 py-5 sm:px-6 border-t border-gray-200 bg-white">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Current Status</dt>
                        <dd className="mt-1 text-sm text-gray-900 uppercase font-bold">{session.status}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Created At</dt>
                        <dd className="mt-1 text-sm text-gray-900">{new Date(session.created_at).toLocaleString()}</dd>
                    </div>
                </dl>

                {session.status.toLowerCase() === 'review_required' && (
                    <div className="mt-8 flex justify-end space-x-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => handleDecision('rejected')}
                            disabled={actionLoading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                        >
                            Reject Identity
                        </button>
                        <button
                            onClick={() => handleDecision('approved')}
                            disabled={actionLoading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 cursor-pointer"
                        >
                            Approve Identity
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
