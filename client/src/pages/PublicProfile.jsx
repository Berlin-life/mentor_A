import { useAuth } from '../context/AuthContext';

const PublicProfile = () => {
    const { user } = useAuth();

    return (
        <div className="page">
            <div className="container-md">
                <h2 className="section-title mb-6">Your Public Profile</h2>
                <p className="text-secondary mb-6">This is how students see your profile when browsing mentors.</p>

                <div className="card" style={{ padding: '2rem' }}>
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6" style={{ flexDirection: 'row' }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--blue-500), var(--purple-500))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 700, color: 'white', flexShrink: 0
                        }}>
                            {user?.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{user?.name}</h2>
                            <p className="text-secondary">{user?.title || 'Mentor'}{user?.company ? ` at ${user.company}` : ''}</p>
                            <span className="badge badge-blue" style={{ marginTop: '0.3rem' }}>🎓 Mentor</span>
                        </div>
                    </div>

                    {/* Bio */}
                    {user?.bio && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-muted text-sm mb-2" style={{ textTransform: 'uppercase' }}>About</h3>
                            <p className="text-secondary">{user.bio}</p>
                        </div>
                    )}

                    {/* Skills */}
                    {user?.skills?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-muted text-sm mb-2" style={{ textTransform: 'uppercase' }}>Skills & Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.map((skill, i) => (
                                    <span key={i} style={{
                                        padding: '0.4rem 0.8rem', borderRadius: 20,
                                        background: 'rgba(59,130,246,0.15)', color: 'var(--blue-400)',
                                        fontSize: '0.85rem', fontWeight: 600
                                    }}>{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Interests */}
                    {user?.interests?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-muted text-sm mb-2" style={{ textTransform: 'uppercase' }}>Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.interests.map((interest, i) => (
                                    <span key={i} style={{
                                        padding: '0.4rem 0.8rem', borderRadius: 20,
                                        background: 'rgba(34,197,94,0.15)', color: 'var(--green-300)',
                                        fontSize: '0.85rem', fontWeight: 600
                                    }}>{interest}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Experience & Availability */}
                    <div className="grid grid-2 gap-4">
                        {user?.experience && (
                            <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                                <p className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Experience</p>
                                <p className="font-bold mt-1">{user.experience}</p>
                            </div>
                        )}
                        {user?.availability && (
                            <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                                <p className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Availability</p>
                                <p className="font-bold mt-1">{user.availability}</p>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-muted text-sm mt-4">
                    <a href="/profile" style={{ color: 'var(--blue-400)' }}>Edit your profile →</a> to update this page.
                </p>
            </div>
        </div>
    );
};

export default PublicProfile;
