import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
    const { user } = useAuth();
    const [connections, setConnections] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const socketURL = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
        socketRef.current = io(socketURL);
        socketRef.current.emit('join_room', user._id);
        socketRef.current.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });
        return () => { socketRef.current.disconnect(); };
    }, [user._id]);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const res = await api.get('/requests');
                const accepted = res.data.filter(req => req.status === 'accepted');
                const contacts = accepted.map(req => req.sender._id === user._id ? req.receiver : req.sender);
                setConnections(contacts);
            } catch (err) { console.error(err); }
        };
        fetchConnections();
    }, [user._id]);

    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                try { const res = await api.get(`/messages/${selectedUser._id}`); setMessages(res.data); }
                catch (err) { console.error(err); }
            };
            fetchMessages();
        }
    }, [selectedUser]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;
        socketRef.current.emit('send_message', { sender: user._id, receiver: selectedUser._id, content: newMessage });
        setNewMessage('');
    };

    return (
        <div className="chat-layout">
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h2 className="text-xl font-bold">Messages</h2>
                </div>
                <div>
                    {connections.map((contact) => (
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
            </div>

            <div className="chat-area">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <div className="avatar avatar-sm avatar-blue mr-3">{selectedUser.name.charAt(0)}</div>
                            <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                        </div>
                        <div className="chat-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`chat-bubble ${msg.sender === user._id ? 'chat-bubble-self' : 'chat-bubble-other'}`}>
                                    <p>{msg.content}</p>
                                    <p className="text-xs mt-1" style={{ opacity: 0.7, textAlign: 'right' }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-bar">
                            <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                                <input type="text" className="input" style={{ flex: 1 }} placeholder="Type a message..."
                                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <button type="submit" className="btn btn-blue">Send</button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="chat-empty"><p>Select a contact to start chatting</p></div>
                )}
            </div>
        </div>
    );
};

export default Chat;
