import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const PublicProfile = () => {
    const { user: authUser } = useAuth();
    const { id } = useParams();
    const [profileUser, setProfileUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    const isOwnProfile = !id || id === authUser?._id;
    const displayUserId = id || authUser?._id;

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isOwnProfile) {
                    setProfileUser(authUser);
                } else {
                    const res = await api.get(`/users/${displayUserId}`);
                    setProfileUser(res.data);
                }

                // Fetch reviews and badges
                const [reviewsRes, badgesRes] = await Promise.all([
                    api.get(`/reviews/mentor/${displayUserId}`).catch(() => ({ data: [] })),
                    api.get(`/users/badges/${displayUserId}`).catch(() => ({ data: [] }))
                ]);
                setReviews(reviewsRes.data);
                setBadges(badgesRes.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [id, authUser]);

    if (loading) return <div className="page"><p className="text-secondary">Loading profile...</p></div>;
    if (!profileUser) return <div className="page"><p className="text-muted">User not found.</p></div>;

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ color: i < Math.round(rating) ? '#f59e0b' : 'var(--text-muted)', fontSize: '1.2rem' }}>★</span>
        ));
    };

    return (
        <div className="page">
            <div className="container-md">
                <h2 className="section-title mb-6">{isOwnProfile ? 'Your Public Profile' : `${profileUser.name}'s Profile`}</h2>
                {isOwnProfile && <p className="text-secondary mb-6">This is how others see your profile.</p>}

                <div className="card" style={{ padding: '2rem' }}>
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6" style={{ flexDirection: 'row' }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--blue-500), var(--purple-500))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 700, color: 'white', flexShrink: 0
                        }}>
                            {profileUser.avatar ? <img src={profileUser.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : profileUser.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{profileUser.name}</h2>
                            <p className="text-secondary">{profileUser.title || profileUser.role}{profileUser.company ? ` at ${profileUser.company}` : ''}</p>
                            <span className={`badge ${profileUser.role === 'mentor' ? 'badge-purple' : 'badge-blue'}`}>{profileUser.role === 'mentor' ? '🎓 Mentor' : '📚 Mentee'}</span>
                        </div>
                    </div>

                    {/* Rating */}
                    {profileUser.averageRating > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2" style={{ flexDirection: 'row' }}>
                                {renderStars(profileUser.averageRating)}
                                <span className="text-secondary ml-2">{profileUser.averageRating.toFixed(1)} / 5 ({profileUser.totalReviews} reviews)</span>
                            </div>
                        </div>
                    )}

                    {/* Badges */}
                    {badges.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-muted text-sm mb-2" style={{ textTransform: 'uppercase' }}>Badges</h3>
                            <div className="flex gap-2" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {badges.map((badge, i) => (
                                    <span key={i} style={{ padding: '0.3rem 0.7rem', borderRadius: 20, background: 'var(--bg-input)', fontSize: '0.85rem' }}>{badge}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bio */}
                    {profileUser.bio && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-muted text-sm mb-2" style={{ textTransform: 'uppercase' }}>About</h3>
                            <p className="text-secondary">{profileUser.bio}</p>
                        </div>
                    )}

                    {/* Skills */}
                    {profileUser.skills?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-muted text-sm mb-2" style={{ textTransform: 'uppercase' }}>Skills & Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                                {profileUser.skills.map((skill, i) => (
                                    <span key={i} style={{ padding: '0.4rem 0.8rem', borderRadius: 20, background: 'rgba(59,130,246,0.15)', color: 'var(--blue-400)', fontSize: '0.85rem', fontWeight: 600 }}>{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Interests */}
                    {profileUser.interests?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-muted text-sm mb-2" style={{ textTransform: 'uppercase' }}>Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {profileUser.interests.map((interest, i) => (
                                    <span key={i} style={{ padding: '0.4rem 0.8rem', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: 'var(--green-300)', fontSize: '0.85rem', fontWeight: 600 }}>{interest}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Experience & Availability */}
                    <div className="grid grid-2 gap-4 mb-6">
                        {profileUser.experience && (
                            <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                                <p className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Experience</p>
                                <p className="font-bold mt-1">{profileUser.experience}</p>
                            </div>
                        )}
                        {profileUser.availability && (
                            <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                                <p className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Availability</p>
                                <p className="font-bold mt-1">{profileUser.availability}</p>
                            </div>
                        )}
                    </div>

                    {/* Availability Slots */}
                    {profileUser.availabilitySlots?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-muted text-sm mb-2" style={{ textTransform: 'uppercase' }}>Available Times</h3>
                            <div className="flex flex-wrap gap-2">
                                {profileUser.availabilitySlots.map((slot, i) => (
                                    <span key={i} className="badge badge-green">{slot.day}: {slot.startTime} - {slot.endTime}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Reviews */}
                {reviews.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold section-divider">⭐ Reviews ({reviews.length})</h3>
                        <div className="flex flex-col gap-3">
                            {reviews.map(review => (
                                <div key={review._id} className="card card-flat">
                                    <div className="flex justify-between items-center mb-2" style={{ flexDirection: 'row' }}>
                                        <div className="flex items-center gap-2" style={{ flexDirection: 'row' }}>
                                            <div className="avatar avatar-sm avatar-purple">{review.reviewer?.name?.charAt(0)}</div>
                                            <span className="font-bold">{review.reviewer?.name}</span>
                                        </div>
                                        <div>{renderStars(review.rating)}</div>
                                    </div>
                                    {review.comment && <p className="text-secondary">{review.comment}</p>}
                                    <p className="text-xs text-muted mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isOwnProfile && (
                    <p className="text-center text-muted text-sm mt-4">
                        <a href="/profile" style={{ color: 'var(--blue-400)' }}>Edit your profile →</a> to update this page.
                    </p>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;
