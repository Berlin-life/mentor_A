import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Heart, Send } from 'lucide-react';

const Forum = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
    const [selectedPost, setSelectedPost] = useState(null);
    const [comment, setComment] = useState('');
    const [message, setMessage] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            await api.post('/posts', newPost);
            setNewPost({ title: '', content: '', category: 'general' });
            setShowNew(false);
            setMessage('Post created!');
            fetchPosts();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) { setMessage('Failed to create post'); setTimeout(() => setMessage(''), 3000); }
    };

    const handleLike = async (postId) => {
        try {
            const res = await api.put(`/posts/${postId}/like`);
            setPosts(posts.map(p => p._id === postId ? { ...p, likes: res.data } : p));
        } catch (err) { console.error(err); }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim() || !selectedPost) return;
        try {
            const res = await api.post(`/posts/${selectedPost._id}/comment`, { content: comment });
            setSelectedPost({ ...selectedPost, comments: res.data });
            setPosts(posts.map(p => p._id === selectedPost._id ? { ...p, comments: res.data } : p));
            setComment('');
        } catch (err) { console.error(err); }
    };

    const openPost = async (postId) => {
        try {
            const res = await api.get(`/posts/${postId}`);
            setSelectedPost(res.data);
        } catch (err) { console.error(err); }
    };

    const categories = [
        { value: 'all', label: '🔥 All', color: 'badge-gray' },
        { value: 'general', label: '💬 General', color: 'badge-blue' },
        { value: 'career', label: '💼 Career', color: 'badge-purple' },
        { value: 'technical', label: '💻 Technical', color: 'badge-green' },
        { value: 'resources', label: '📚 Resources', color: 'badge-yellow' }
    ];

    const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.category === filter);

    if (loading) return <div className="page"><p className="text-secondary">Loading forum...</p></div>;

    return (
        <div className="page">
            <div className="container-md">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="section-title">Community Forum</h2>
                        <p className="text-secondary text-sm">Ask questions, share knowledge, connect with the community</p>
                    </div>
                    <button onClick={() => setShowNew(true)} className="btn btn-blue">+ New Post</button>
                </div>

                {message && <div className="alert alert-success">{message}</div>}

                {/* Category Filters */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {categories.map(cat => (
                        <button key={cat.value}
                            onClick={() => setFilter(cat.value)}
                            className={`badge ${filter === cat.value ? 'badge-blue' : cat.color}`}
                            style={{
                                cursor: 'pointer', padding: '0.35rem 0.85rem', fontSize: '0.85rem', border: 'none',
                                outline: filter === cat.value ? '2px solid var(--blue-400)' : 'none',
                                outlineOffset: 2
                            }}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Posts */}
                <div className="flex flex-col gap-4">
                    {filteredPosts.length === 0 ? (
                        <div className="card text-center p-8">
                            <MessageSquare size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
                            <p className="text-muted text-lg mb-2">No posts yet</p>
                            <p className="text-secondary text-sm">Be the first to start a discussion!</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div key={post._id} className="card card-flat" style={{ cursor: 'pointer' }} onClick={() => openPost(post._id)}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="avatar avatar-sm avatar-blue">{post.author?.name?.charAt(0) || '?'}</div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{post.author?.name}</p>
                                        <p className="text-xs text-muted">{post.author?.role} · {new Date(post.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`badge ${categories.find(c => c.value === post.category)?.color || 'badge-blue'}`}>
                                        {post.category || 'general'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                                <p className="text-secondary" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-4 mt-3 text-muted text-sm">
                                    <span onClick={(e) => { e.stopPropagation(); handleLike(post._id); }}
                                        style={{
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                            color: post.likes?.includes(user?._id) ? 'var(--red-500)' : 'inherit'
                                        }}>
                                        <Heart size={16} fill={post.likes?.includes(user?._id) ? 'var(--red-500)' : 'none'} />
                                        {post.likes?.length || 0}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <MessageSquare size={16} /> {post.comments?.length || 0} replies
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* New Post Modal */}
                {showNew && (
                    <div className="modal-overlay" onClick={() => setShowNew(false)}>
                        <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                            <h3 className="text-2xl font-bold mb-4">Create a Post</h3>
                            <form onSubmit={handleCreatePost}>
                                <div className="mb-4">
                                    <label>Category</label>
                                    <select className="select" value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}>
                                        {categories.filter(c => c.value !== 'all').map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label>Title</label>
                                    <input type="text" className="input" placeholder="What's on your mind?"
                                        value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} required />
                                </div>
                                <div className="mb-6">
                                    <label>Content</label>
                                    <textarea className="textarea" rows="5" placeholder="Share your thoughts..."
                                        value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} required></textarea>
                                </div>
                                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowNew(false)} className="btn btn-gray">Cancel</button>
                                    <button type="submit" className="btn btn-blue">Post</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Post Detail Modal with Comments */}
                {selectedPost && (
                    <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
                        <div className="modal-content" style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="avatar avatar-sm avatar-blue">{selectedPost.author?.name?.charAt(0)}</div>
                                <div className="flex-1">
                                    <p className="font-semibold">{selectedPost.author?.name}</p>
                                    <p className="text-xs text-muted">{selectedPost.author?.role} · {new Date(selectedPost.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                            </div>

                            <h3 className="text-2xl font-bold mb-2">{selectedPost.title}</h3>
                            <p className="text-secondary mb-4" style={{ whiteSpace: 'pre-wrap' }}>{selectedPost.content}</p>

                            <div className="flex items-center gap-4 mb-6 text-muted text-sm" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <span onClick={() => handleLike(selectedPost._id)}
                                    style={{
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                        color: selectedPost.likes?.includes(user?._id) ? 'var(--red-500)' : 'inherit'
                                    }}>
                                    <Heart size={16} fill={selectedPost.likes?.includes(user?._id) ? 'var(--red-500)' : 'none'} />
                                    {selectedPost.likes?.length || 0} likes
                                </span>
                                <span>{selectedPost.comments?.length || 0} replies</span>
                            </div>

                            {/* Comment Input */}
                            <form onSubmit={handleComment} className="flex gap-2 mb-4">
                                <input type="text" className="input" style={{ flex: 1 }} placeholder="Write a reply..."
                                    value={comment} onChange={(e) => setComment(e.target.value)} />
                                <button type="submit" className="btn btn-blue btn-sm"><Send size={16} /></button>
                            </form>

                            {/* Comments List */}
                            <div className="flex flex-col gap-3">
                                {(selectedPost.comments || []).map((c, i) => (
                                    <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="avatar avatar-blue" style={{ width: 24, height: 24, fontSize: '0.7rem' }}>{c.author?.name?.charAt(0) || '?'}</div>
                                            <span className="font-semibold text-sm">{c.author?.name || 'User'}</span>
                                            <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-secondary text-sm">{c.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Forum;
