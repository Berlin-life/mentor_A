import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Sticker set
const STICKERS = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '🔥', '❤️', '🎉', '🤣', '😭', '😊', '🙏', '💯', '🥹', '😤', '🤩', '👏', '🎓', '💡', '📚', '🚀', '✨', '😅'];

const Chat = () => {
    const { user } = useAuth();
    const [connections, setConnections] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const socketRef = useRef();
    const messagesEndRef = useRef();
    const fileInputRef = useRef();
    const cameraInputRef = useRef();
    const audioInputRef = useRef();
    const docInputRef = useRef();
    const mediaRecorderRef = useRef();
    const audioChunksRef = useRef([]);
    const recordTimerRef = useRef();

    useEffect(() => {
        const socketURL = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
        socketRef.current = io(socketURL);
        socketRef.current.emit('join_room', user._id);
        socketRef.current.on('receive_message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });
        return () => socketRef.current.disconnect();
    }, [user._id]);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const res = await api.get('/requests');
                const accepted = res.data.filter(r => r.status === 'accepted');
                const contacts = accepted.map(r => r.sender._id === user._id ? r.receiver : r.sender);
                setConnections(contacts);
            } catch (err) { console.error(err); }
        };
        fetchConnections();
    }, [user._id]);

    useEffect(() => {
        if (selectedUser) {
            api.get(`/messages/${selectedUser._id}`)
                .then(res => setMessages(res.data))
                .catch(console.error);
        }
    }, [selectedUser]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Send text message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;
        socketRef.current.emit('send_message', {
            sender: user._id, receiver: selectedUser._id,
            content: newMessage, type: 'text'
        });
        setNewMessage('');
    };

    // Send sticker
    const handleStickerSend = (sticker) => {
        if (!selectedUser) return;
        socketRef.current.emit('send_message', {
            sender: user._id, receiver: selectedUser._id,
            content: sticker, type: 'sticker'
        });
        setShowStickerPicker(false);
    };

    // File to base64
    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });

    // Send file (gallery/camera/audio/document)
    const handleFileMessage = async (file, type) => {
        if (!file || !selectedUser) return;
        const fileData = await toBase64(file);
        socketRef.current.emit('send_message', {
            sender: user._id, receiver: selectedUser._id,
            content: file.name, type,
            fileData, fileName: file.name, fileMime: file.type
        });
        setShowAttachMenu(false);
    };

    // Voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                await handleFileMessage(file, 'voice');
                setRecordingTime(0);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } catch (err) { alert('Microphone access denied'); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordTimerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Override onstop so it discards instead of sending
            mediaRecorderRef.current.onstop = () => {
                mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingTime(0);
            clearInterval(recordTimerRef.current);
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Render a message bubble
    const renderMessage = (msg, index) => {
        const isSelf = msg.sender === user._id || msg.sender?._id === user._id;
        return (
            <div key={index} className={`chat-bubble ${isSelf ? 'chat-bubble-self' : 'chat-bubble-other'}`}>
                {msg.type === 'text' && <p>{msg.content}</p>}

                {msg.type === 'sticker' && (
                    <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{msg.content}</span>
                )}

                {msg.type === 'image' && (
                    <div>
                        <img src={msg.fileData} alt="Image" style={{ maxWidth: 220, borderRadius: 8, display: 'block', marginBottom: 4 }} />
                        {msg.fileName && <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{msg.fileName}</p>}
                    </div>
                )}

                {msg.type === 'document' && (
                    <a href={msg.fileData} download={msg.fileName} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
                        <span style={{ fontSize: '1.5rem' }}>📄</span>
                        <span style={{ fontSize: '0.85rem' }}>{msg.fileName}</span>
                    </a>
                )}

                {(msg.type === 'audio') && (
                    <div>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>🎵 {msg.fileName}</span>
                        <audio controls src={msg.fileData} style={{ width: 180, display: 'block', marginTop: 4 }} />
                    </div>
                )}

                {msg.type === 'voice' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.2rem' }}>🎤</span>
                        <audio controls src={msg.fileData} style={{ width: 160 }} />
                    </div>
                )}

                <p className="text-xs mt-1" style={{ opacity: 0.6, textAlign: 'right' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        );
    };

    return (
        <>
            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFileMessage(e.target.files[0], 'image')} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={e => handleFileMessage(e.target.files[0], 'image')} />
            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }}
                onChange={e => handleFileMessage(e.target.files[0], 'audio')} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" style={{ display: 'none' }}
                onChange={e => handleFileMessage(e.target.files[0], 'document')} />

            <div className="chat-layout">
                {/* Sidebar */}
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header">
                        <h2 className="text-xl font-bold">Messages</h2>
                    </div>
                    {connections.length === 0 && (
                        <p className="text-muted text-sm" style={{ padding: '1rem' }}>No connections yet. Accept requests first.</p>
                    )}
                    {connections.map(contact => (
                        <div key={contact._id} onClick={() => setSelectedUser(contact)}
                            className={`chat-contact ${selectedUser?._id === contact._id ? 'active' : ''}`}>
                            <div className="avatar avatar-sm avatar-blue mr-3">{contact.name.charAt(0)}</div>
                            <div>
                                <p className="font-semibold">{contact.name}</p>
                                <p className="text-xs text-muted">{contact.role}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat Area */}
                <div className="chat-area">
                    {selectedUser ? (
                        <>
                            <div className="chat-header">
                                <div className="avatar avatar-sm avatar-blue mr-3">{selectedUser.name.charAt(0)}</div>
                                <div>
                                    <h3 className="font-bold">{selectedUser.name}</h3>
                                    <p className="text-xs text-muted">{selectedUser.role}</p>
                                </div>
                            </div>

                            <div className="chat-messages">
                                {messages.map(renderMessage)}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Sticker Picker */}
                            {showStickerPicker && (
                                <div style={{
                                    position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    borderRadius: 12, padding: '0.75rem', display: 'flex', flexWrap: 'wrap',
                                    gap: 6, width: 280, zIndex: 20, boxShadow: 'var(--shadow)'
                                }}>
                                    {STICKERS.map(s => (
                                        <button key={s} onClick={() => handleStickerSend(s)} style={{
                                            fontSize: '1.6rem', background: 'none', border: 'none',
                                            cursor: 'pointer', borderRadius: 6, padding: '0.2rem 0.3rem'
                                        }}>{s}</button>
                                    ))}
                                </div>
                            )}

                            {/* Attach Menu */}
                            {showAttachMenu && (
                                <div style={{
                                    position: 'absolute', bottom: 80, left: 16,
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    borderRadius: 12, padding: '0.5rem', zIndex: 20, boxShadow: 'var(--shadow)',
                                    display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160
                                }}>
                                    {[
                                        { icon: '🖼️', label: 'Gallery', action: () => fileInputRef.current.click() },
                                        { icon: '📷', label: 'Camera', action: () => cameraInputRef.current.click() },
                                        { icon: '🎵', label: 'Audio', action: () => audioInputRef.current.click() },
                                        { icon: '📄', label: 'Document', action: () => docInputRef.current.click() },
                                        { icon: '😊', label: 'Sticker', action: () => { setShowStickerPicker(p => !p); setShowAttachMenu(false); } },
                                    ].map(item => (
                                        <button key={item.label} onClick={item.action} style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            background: 'none', border: 'none', color: 'var(--text-primary)',
                                            cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: 8,
                                            fontSize: '0.9rem', textAlign: 'left',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span> {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input Bar */}
                            <div className="chat-input-bar" style={{ position: 'relative' }}>
                                {isRecording ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, padding: '0 0.5rem' }}>
                                        <span style={{ color: 'var(--red-500)', fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>⏺</span>
                                        <span className="font-semibold">{formatTime(recordingTime)}</span>
                                        <span className="text-muted text-sm">Recording...</span>
                                        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                                            <button onClick={cancelRecording} className="btn btn-gray btn-sm">
                                                ✕ Cancel
                                            </button>
                                            <button onClick={stopRecording} className="btn btn-blue btn-sm">
                                                Send 🎤
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
                                        {/* Attach button */}
                                        <button type="button" onClick={() => { setShowAttachMenu(p => !p); setShowStickerPicker(false); }}
                                            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.3rem' }}>
                                            📎
                                        </button>

                                        <input type="text" className="input" style={{ flex: 1 }}
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onFocus={() => { setShowAttachMenu(false); setShowStickerPicker(false); }} />

                                        {/* Sticker button */}
                                        <button type="button" onClick={() => { setShowStickerPicker(p => !p); setShowAttachMenu(false); }}
                                            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0.3rem' }}>
                                            😊
                                        </button>

                                        {/* Voice note button (hold) */}
                                        <button type="button"
                                            onMouseDown={startRecording}
                                            onMouseUp={stopRecording}
                                            onTouchStart={startRecording}
                                            onTouchEnd={stopRecording}
                                            title="Hold to record voice note"
                                            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.3rem' }}>
                                            🎤
                                        </button>

                                        {newMessage.trim() && (
                                            <button type="submit" className="btn btn-blue">Send</button>
                                        )}
                                    </form>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="chat-empty">
                            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</p>
                            <p className="font-semibold">Select a contact to start chatting</p>
                            <p className="text-muted text-sm">Send messages, images, voice notes and more</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Chat;
