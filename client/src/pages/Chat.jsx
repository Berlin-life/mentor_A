import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];
const STICKERS = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '🔥', '❤️', '🎉', '🤣', '😭', '😊', '🙏', '💯', '🥹', '😤', '🤩', '👏', '🎓', '💡', '📚', '🚀', '✨', '😅'];
const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '🤔', '🤭', '🤗', '😐', '😒', '🙄', '😬', '😔', '😴', '😷', '🤒', '🤢', '🤮', '😵', '🥳', '😎', '👍', '👎', '👌', '✌️', '🤞', '🤙', '👈', '👉', '👆', '✋', '💪', '🤝', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💕', '💖', '🔥', '✨', '🌟', '⭐', '🌈', '🌙', '☀️', '🎉', '🎊', '🎁', '🎂', '🍕', '🍔', '🌮', '🍜', '🍣', '🎮', '⚽', '🏀', '🚀', '✈️', '🏠', '🌍'];

const formatSidebarTime = (d) => {
    if (!d) return '';
    const date = new Date(d), now = new Date();
    const diff = Math.floor((now - date) / 86400000);
    if (diff === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const getDateLabel = (d) => {
    const date = new Date(d), now = new Date();
    const diff = Math.floor((now - date) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' });
};

const isSameDay = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return da.toDateString() === db.toDateString();
};

const Chat = () => {
    const { user } = useAuth();
    const [connections, setConnections] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [replyTo, setReplyTo] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [hoveredMsg, setHoveredMsg] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiTab, setEmojiTab] = useState('emoji');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [lastMessages, setLastMessages] = useState({});
    const [copied, setCopied] = useState(false);

    const socketRef = useRef();
    const messagesEndRef = useRef();
    const textareaRef = useRef();
    const fileInputRef = useRef();
    const cameraInputRef = useRef();
    const audioInputRef = useRef();
    const docInputRef = useRef();
    const mediaRecorderRef = useRef();
    const audioChunksRef = useRef([]);
    const recordTimerRef = useRef();
    const typingTimeoutRef = useRef();
    const selectedUserRef = useRef(null);
    useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

    // Socket setup
    useEffect(() => {
        const url = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
        socketRef.current = io(url);
        socketRef.current.emit('join_room', user._id);

        socketRef.current.on('receive_message', (msg) => {
            setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
            const other = msg.sender === user._id ? msg.receiver : msg.sender;
            setLastMessages(prev => ({ ...prev, [typeof other === 'object' ? other._id : other]: msg }));
        });
        socketRef.current.on('typing', ({ from }) => { if (selectedUserRef.current?._id === from) setIsTyping(true); });
        socketRef.current.on('stop_typing', ({ from }) => { if (selectedUserRef.current?._id === from) setIsTyping(false); });
        socketRef.current.on('user_status', ({ userId, online }) => {
            setOnlineUsers(prev => { const s = new Set(prev); online ? s.add(userId) : s.delete(userId); return s; });
        });
        socketRef.current.on('message_reaction', ({ messageId, reactions }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
        });
        socketRef.current.on('message_deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });
        return () => socketRef.current.disconnect();
    }, [user._id]);

    useEffect(() => {
        api.get('/requests').then(res => {
            const accepted = res.data.filter(r => r.status === 'accepted');
            setConnections(accepted.map(r => r.sender._id === user._id ? r.receiver : r.sender));
        }).catch(console.error);
    }, [user._id]);

    useEffect(() => {
        if (!selectedUser) return;
        api.get(`/messages/${selectedUser._id}`).then(res => {
            setMessages(res.data);
            if (res.data.length > 0)
                setLastMessages(prev => ({ ...prev, [selectedUser._id]: res.data[res.data.length - 1] }));
        }).catch(console.error);
    }, [selectedUser]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleTyping = (val) => {
        setNewMessage(val);
        if (!selectedUser) return;
        socketRef.current.emit('typing', { to: selectedUser._id });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => socketRef.current.emit('stop_typing', { to: selectedUser._id }), 1500);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

    const sendText = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;
        socketRef.current.emit('send_message', { sender: user._id, receiver: selectedUser._id, content: newMessage, type: 'text', replyTo: replyTo?._id || null });
        socketRef.current.emit('stop_typing', { to: selectedUser._id });
        setNewMessage(''); setReplyTo(null);
        if (textareaRef.current) textareaRef.current.style.height = '40px';
    };

    const sendSticker = (s) => { if (!selectedUser) return; socketRef.current.emit('send_message', { sender: user._id, receiver: selectedUser._id, content: s, type: 'sticker' }); setShowEmojiPicker(false); };

    const toBase64 = (f) => new Promise((r, j) => { const x = new FileReader(); x.readAsDataURL(f); x.onload = () => r(x.result); x.onerror = j; });

    const sendFile = async (file, type) => {
        if (!file || !selectedUser) return;
        const fileData = await toBase64(file);
        socketRef.current.emit('send_message', { sender: user._id, receiver: selectedUser._id, content: file.name, type, fileData, fileName: file.name, fileMime: file.type, replyTo: replyTo?._id || null });
        setShowAttachMenu(false); setReplyTo(null);
    };

    const startRec = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                await sendFile(new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }), 'voice');
                setRecordingTime(0);
            };
            mediaRecorderRef.current.start(); setIsRecording(true);
            recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } catch { alert('Microphone access denied'); }
    };
    const stopRec = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); clearInterval(recordTimerRef.current); } };
    const cancelRec = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => { };
            mediaRecorderRef.current.stop(); setIsRecording(false); setRecordingTime(0); clearInterval(recordTimerRef.current);
        }
    };

    const deleteMsg = async (id) => {
        await api.delete(`/messages/${id}`);
        setMessages(prev => prev.filter(m => m._id !== id));
        socketRef.current.emit('message_deleted', { messageId: id, receiverId: selectedUser._id });
    };

    const reactToMsg = async (msg, emoji) => {
        const res = await api.put(`/messages/${msg._id}/react`, { emoji });
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, reactions: res.data.reactions } : m));
        socketRef.current.emit('message_reaction', { messageId: msg._id, reactions: res.data.reactions, receiverId: selectedUser._id });
        setContextMenu(null); setHoveredMsg(null);
    };

    const copyMsg = (msg) => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); setContextMenu(null); };
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const renderMsg = (msg, i, all) => {
        const isSelf = msg.sender === user._id || msg.sender?._id === user._id;
        const showDate = i === 0 || !isSameDay(all[i - 1].createdAt, msg.createdAt);
        const replyMsg = msg.replyTo ? (typeof msg.replyTo === 'object' ? msg.replyTo : all.find(m => m._id === msg.replyTo)) : null;
        const rxns = msg.reactions || [];
        const ts = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return (
            <div key={msg._id || i}>
                {showDate && <div className="wa-date-sep"><span>{getDateLabel(msg.createdAt)}</span></div>}
                <div className={`wa-row ${isSelf ? 'wa-row-self' : 'wa-row-other'}`}
                    onMouseEnter={() => setHoveredMsg(msg._id)} onMouseLeave={() => setHoveredMsg(null)}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg }); }}>

                    {/* Hover actions */}
                    {hoveredMsg === msg._id && (
                        <div className={`wa-actions ${isSelf ? 'wa-actions-self' : 'wa-actions-other'}`}>
                            <div className="wa-react-wrap">
                                <button className="wa-icon-sm">😊</button>
                                <div className="wa-react-panel">
                                    {REACTIONS.map(e => <button key={e} onClick={() => reactToMsg(msg, e)} className="wa-react-opt">{e}</button>)}
                                </div>
                            </div>
                            <button className="wa-icon-sm" onClick={() => setReplyTo(msg)} title="Reply">↩</button>
                            <button className="wa-icon-sm" onClick={e => setContextMenu({ x: e.clientX, y: e.clientY, msg })} title="More">⌄</button>
                        </div>
                    )}

                    <div className={`wa-bubble ${isSelf ? 'wa-bubble-self' : 'wa-bubble-other'}`}>
                        {/* Reply quote */}
                        {replyMsg && (
                            <div className="wa-reply">
                                <div className="wa-reply-strip" />
                                <div>
                                    <p className="wa-reply-name">{replyMsg.sender === user._id ? 'You' : selectedUser?.name}</p>
                                    <p className="wa-reply-text">{replyMsg.type === 'text' ? replyMsg.content : `📎 ${replyMsg.type}`}</p>
                                </div>
                            </div>
                        )}

                        {msg.type === 'text' && (
                            <span className="bubble-text">
                                {msg.content}
                                <span className="bubble-spacer" />
                                <span className="bubble-timestamp">{ts}{isSelf && <span className="wa-tick"> ✓✓</span>}</span>
                            </span>
                        )}
                        {msg.type === 'sticker' && <div><span style={{ fontSize: '2.8rem', display: 'block' }}>{msg.content}</span><div style={{ textAlign: 'right' }}><span className="bubble-timestamp">{ts}</span></div></div>}
                        {msg.type === 'image' && <div><img src={msg.fileData} alt="" style={{ maxWidth: 240, borderRadius: 8, display: 'block', marginBottom: 4 }} /><div style={{ textAlign: 'right' }}><span className="bubble-timestamp">{ts}{isSelf && <span className="wa-tick"> ✓✓</span>}</span></div></div>}
                        {msg.type === 'document' && (
                            <div>
                                <a href={msg.fileData} download={msg.fileName} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>📄</div>
                                    <div><p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{msg.fileName}</p><p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Document</p></div>
                                </a>
                                <div style={{ textAlign: 'right', marginTop: 4 }}><span className="bubble-timestamp">{ts}{isSelf && <span className="wa-tick"> ✓✓</span>}</span></div>
                            </div>
                        )}
                        {msg.type === 'audio' && <div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>🎵</span><audio controls src={msg.fileData} style={{ width: 180 }} /></div><div style={{ textAlign: 'right', marginTop: 4 }}><span className="bubble-timestamp">{ts}</span></div></div>}
                        {msg.type === 'voice' && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: isSelf ? 'rgba(255,255,255,0.2)' : 'rgba(0,175,90,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎤</div>
                                    <audio controls src={msg.fileData} style={{ width: 160 }} />
                                </div>
                                <div style={{ textAlign: 'right', marginTop: 4 }}><span className="bubble-timestamp">{ts}{isSelf && <span className="wa-tick"> ✓✓</span>}</span></div>
                            </div>
                        )}

                        {rxns.length > 0 && (
                            <div className="wa-rxns">
                                {Object.entries(rxns.reduce((a, r) => ({ ...a, [r.emoji]: (a[r.emoji] || 0) + 1 }), {})).map(([emoji, count]) => (
                                    <span key={emoji} className="wa-rxn-badge" onClick={() => reactToMsg(msg, emoji)}>{emoji}{count > 1 ? ` ${count}` : ''}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const filtered = connections.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => sendFile(e.target.files[0], 'image')} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => sendFile(e.target.files[0], 'image')} />
            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => sendFile(e.target.files[0], 'audio')} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.xlsx,.txt,.zip" style={{ display: 'none' }} onChange={e => sendFile(e.target.files[0], 'document')} />

            {/* Context menu */}
            {contextMenu && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setContextMenu(null)} />
                    <div className="wa-ctx-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <button onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }}>↩ Reply</button>
                        {contextMenu.msg.type === 'text' && <button onClick={() => copyMsg(contextMenu.msg)}>📋 Copy</button>}
                        <div className="wa-ctx-reactions">{REACTIONS.map(e => <button key={e} onClick={() => reactToMsg(contextMenu.msg, e)}>{e}</button>)}</div>
                        {(contextMenu.msg.sender === user._id || contextMenu.msg.sender?._id === user._id) && (
                            <button onClick={() => { deleteMsg(contextMenu.msg._id); setContextMenu(null); }} style={{ color: '#f87171' }}>🗑 Delete</button>
                        )}
                    </div>
                </>
            )}

            {copied && <div className="wa-toast">Copied!</div>}

            <div className="wa-layout" onClick={() => { setShowAttachMenu(false); setShowEmojiPicker(false); setShowHeaderMenu(false); setContextMenu(null); }}>

                {/* ===== SIDEBAR ===== */}
                <div className="wa-sidebar">
                    <div className="wa-sidebar-hdr">
                        <div className="avatar avatar-sm avatar-blue">{user.name.charAt(0)}</div>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Chats</span>
                        <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '0.8rem' }}>{connections.length} contacts</span>
                    </div>
                    <div style={{ padding: '8px 12px' }}>
                        <div className="wa-search">
                            <span>🔍</span>
                            <input type="text" placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                style={{ background: 'none', border: 'none', outline: 'none', color: 'inherit', flex: 1, fontSize: '0.875rem' }} />
                        </div>
                    </div>
                    <div className="wa-contacts">
                        {filtered.length === 0 && <p style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>{connections.length === 0 ? 'No connections yet' : 'No results'}</p>}
                        {filtered.map(c => {
                            const last = lastMessages[c._id];
                            return (
                                <div key={c._id} className={`wa-contact ${selectedUser?._id === c._id ? 'wa-contact-active' : ''}`} onClick={() => setSelectedUser(c)}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div className="avatar avatar-md avatar-blue">{c.name.charAt(0)}</div>
                                        {onlineUsers.has(c._id) && <div className="wa-dot" />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.925rem' }}>{c.name}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatSidebarTime(last?.createdAt)}</p>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {last ? (last.type === 'text' ? last.content : `📎 ${last.type}`) : c.role}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== CHAT AREA ===== */}
                <div className="wa-chat">
                    {selectedUser ? (
                        <>
                            {/* Header */}
                            <div className="wa-chat-hdr">
                                <div style={{ position: 'relative' }}>
                                    <div className="avatar avatar-sm avatar-blue">{selectedUser.name.charAt(0)}</div>
                                    {onlineUsers.has(selectedUser._id) && <div className="wa-dot" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedUser.name}</p>
                                    <p style={{ fontSize: '0.72rem', color: isTyping ? '#00af5a' : 'var(--text-muted)' }}>
                                        {isTyping ? 'typing...' : onlineUsers.has(selectedUser._id) ? 'online' : selectedUser.role}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="wa-icon-btn" title="Voice call (coming soon)">📞</button>
                                    <button className="wa-icon-btn" title="Video call (coming soon)">🎥</button>
                                    <div style={{ position: 'relative' }}>
                                        <button className="wa-icon-btn" onClick={e => { e.stopPropagation(); setShowHeaderMenu(p => !p); }}>⋮</button>
                                        {showHeaderMenu && (
                                            <div className="wa-dropdown" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => { setMessages([]); setShowHeaderMenu(false); }}>🗑 Clear chat</button>
                                                <button onClick={() => { setSelectedUser(null); setShowHeaderMenu(false); }}>← Close chat</button>
                                                <button onClick={() => setShowHeaderMenu(false)}>🔇 Mute</button>
                                                <button onClick={() => setShowHeaderMenu(false)}>🚫 Block</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages background */}
                            <div className="wa-msgs-bg" onClick={() => setContextMenu(null)}>
                                {messages.length === 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40%' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 16, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            🔒 Messages are end-to-end encrypted
                                        </div>
                                    </div>
                                )}
                                {messages.map((msg, i) => renderMsg(msg, i, messages))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply preview */}
                            {replyTo && (
                                <div className="wa-reply-bar">
                                    <div style={{ borderLeft: '3px solid #00af5a', paddingLeft: 10, flex: 1 }}>
                                        <p style={{ fontSize: '0.75rem', color: '#00af5a', fontWeight: 600 }}>↩ Replying to {replyTo.sender === user._id ? 'Yourself' : selectedUser.name}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.type === 'text' ? replyTo.content : `📎 ${replyTo.type}`}</p>
                                    </div>
                                    <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                                </div>
                            )}

                            {/* Emoji/Sticker picker */}
                            {showEmojiPicker && (
                                <div className="wa-emoji-picker" onClick={e => e.stopPropagation()}>
                                    <div className="wa-emoji-tabs">
                                        <button className={emojiTab === 'emoji' ? 'active' : ''} onClick={() => setEmojiTab('emoji')}>😀 Emoji</button>
                                        <button className={emojiTab === 'sticker' ? 'active' : ''} onClick={() => setEmojiTab('sticker')}>✨ Stickers</button>
                                    </div>
                                    {emojiTab === 'emoji'
                                        ? <div className="wa-emoji-grid">{EMOJIS.map(e => <button key={e} onClick={() => { setNewMessage(p => p + e); textareaRef.current?.focus(); }} className="wa-emoji-btn">{e}</button>)}</div>
                                        : <div className="wa-sticker-grid">{STICKERS.map(s => <button key={s} onClick={() => sendSticker(s)} className="wa-sticker-btn">{s}</button>)}</div>
                                    }
                                </div>
                            )}

                            {/* Attach menu */}
                            {showAttachMenu && (
                                <div className="wa-attach-menu" onClick={e => e.stopPropagation()}>
                                    {[
                                        { icon: '🖼️', label: 'Gallery', color: '#9333ea', fn: () => fileInputRef.current.click() },
                                        { icon: '📷', label: 'Camera', color: '#ec4899', fn: () => cameraInputRef.current.click() },
                                        { icon: '📄', label: 'Document', color: '#3b82f6', fn: () => docInputRef.current.click() },
                                        { icon: '🎵', label: 'Audio', color: '#f97316', fn: () => audioInputRef.current.click() },
                                        { icon: '😊', label: 'Sticker', color: '#22c55e', fn: () => { setEmojiTab('sticker'); setShowEmojiPicker(true); setShowAttachMenu(false); } },
                                    ].map(item => (
                                        <button key={item.label} className="wa-attach-item" onClick={item.fn}>
                                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 6 }}>{item.icon}</div>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input bar */}
                            <div className="wa-input-bar">
                                {isRecording ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, padding: '0 8px' }}>
                                        <span style={{ color: '#f87171', fontSize: '1.1rem' }}>⏺</span>
                                        <span style={{ fontWeight: 600 }}>{fmt(recordingTime)}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Recording voice note...</span>
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                            <button onClick={cancelRec} className="btn btn-gray btn-sm">✕ Cancel</button>
                                            <button onClick={stopRec} className="btn btn-blue btn-sm">Send 🎤</button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={sendText} style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'flex-end' }}>
                                        <button type="button" className="wa-icon-btn" onClick={e => { e.stopPropagation(); setShowAttachMenu(p => !p); setShowEmojiPicker(false); }}>📎</button>
                                        <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 24, padding: '6px 12px', display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                                            <textarea
                                                ref={textareaRef} rows={1} value={newMessage}
                                                onChange={e => handleTyping(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(e); } }}
                                                placeholder="Type a message"
                                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'inherit', resize: 'none', fontSize: '0.925rem', lineHeight: '1.5', minHeight: 24, maxHeight: 120, overflowY: 'auto' }}
                                            />
                                            <button type="button" className="wa-icon-btn" onClick={e => { e.stopPropagation(); setShowEmojiPicker(p => !p); setShowAttachMenu(false); }}>😊</button>
                                        </div>
                                        {newMessage.trim()
                                            ? <button type="submit" className="wa-send-btn">➤</button>
                                            : <button type="button" className="wa-send-btn" onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec} title="Hold to record">🎤</button>
                                        }
                                    </form>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="wa-empty">
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>MentorMatch Chat</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select a contact to start messaging</p>
                            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                🔒 Your messages are end-to-end encrypted
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Chat;
