import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Requests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests');
            setRequests(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleRequest = async (id, status) => {
        try {
            await api.put(`/requests/${id}`, { status });
            fetchRequests();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="page"><p className="text-secondary">Loading requests...</p></div>;

    const incomingRequests = requests.filter(req => req.receiver._id === user._id && req.status === 'pending');
    const sentRequests = requests.filter(req => req.sender._id === user._id);

    return (
        <div className="page">
            <div className="container-md">
                <h2 className="section-title mb-6">Connection Requests</h2>

                <div className="mb-8">
                    <h3 className="text-xl font-semibold section-divider">Incoming Requests</h3>
                    {incomingRequests.length === 0 ? (
                        <p className="text-muted">No pending incoming requests.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {incomingRequests.map((req) => (
                                <div key={req._id} className="card flex justify-between items-center" style={{ flexDirection: 'row' }}>
                                    <div className="flex items-center">
                                        <div className="avatar avatar-sm avatar-purple mr-3">{req.sender.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold">{req.sender.name}</p>
                                            <p className="text-sm text-muted">{req.sender.role}</p>
                                            {req.message && <p className="text-xs text-muted mt-1">"{req.message}"</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRequest(req._id, 'accepted')} className="btn btn-green btn-sm">Accept</button>
                                        <button onClick={() => handleRequest(req._id, 'rejected')} className="btn btn-red btn-sm">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-semibold section-divider">Sent Requests</h3>
                    {sentRequests.length === 0 ? (
                        <p className="text-muted">No sent requests.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {sentRequests.map((req) => (
                                <div key={req._id} className="card flex items-center" style={{ flexDirection: 'row', opacity: 0.75 }}>
                                    <div className="avatar avatar-sm avatar-gray mr-3">{req.receiver.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold">{req.receiver.name}</p>
                                        <span className={`badge ${req.status === 'accepted' ? 'badge-green' :
                                                req.status === 'rejected' ? 'badge-red' : 'badge-yellow'
                                            }`}>{req.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Requests;
