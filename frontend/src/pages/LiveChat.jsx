import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Send, Power, RefreshCw, Smartphone } from 'lucide-react';

const LiveChat = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [history, setHistory] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const token = localStorage.getItem('token');

    // Fetch active chats
    const fetchChats = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setChats(data);
        } catch (error) {
            console.error(error);
        }
    };

    // Auto-refresh chat list every 10s
    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, []);

    // Fetch History when chat selected
    useEffect(() => {
        if (selectedChat) {
            fetchHistory(selectedChat.remoteJid);
        }
    }, [selectedChat]);

    const fetchHistory = async (remoteJid) => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/history?remoteJid=${remoteJid}&limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setHistory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleToggleBot = async () => {
        if (!selectedChat) return;
        const newStatus = !selectedChat.isBotActive;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/toggle-bot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    remoteJid: selectedChat.remoteJid,
                    status: newStatus
                })
            });
            if (res.ok) {
                // Update local state
                setSelectedChat(prev => ({ ...prev, isBotActive: newStatus }));
                setChats(prev => prev.map(c => c.remoteJid === selectedChat.remoteJid ? { ...c, isBotActive: newStatus } : c));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedChat) return;

        setLoading(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    remoteJid: selectedChat.remoteJid,
                    text: messageText
                })
            });
            setMessageText('');
            // Refresh history after short delay
            setTimeout(() => fetchHistory(selectedChat.remoteJid), 2000);
        } catch (error) {
            alert('Erro ao enviar mensagem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-gray-900 text-white rounded-lg overflow-hidden border border-gray-700">
            {/* Sidebar - Chat List */}
            <div className="w-1/3 border-r border-gray-700 bg-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-700 font-bold flex justify-between items-center">
                    <span>Conversas Ativas</span>
                    <button onClick={fetchChats} className="p-1 hover:bg-gray-700 rounded"><RefreshCw size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 && <div className="p-4 text-gray-400 text-center">Nenhuma conversa recente</div>}
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition ${selectedChat?.id === chat.id ? 'bg-gray-700 border-green-500 border-l-4' : ''}`}
                        >
                            <div className="flex justify-between">
                                <span className="font-medium truncate">{chat.remoteJid.split('@')[0]}</span>
                                <span className="text-xs text-gray-500">{new Date(chat.lastInteraction).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {chat.isBotActive ?
                                    <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">🤖 Bot</span> :
                                    <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full flex items-center gap-1">👨‍💻 Humano</span>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="w-2/3 flex flex-col bg-gray-900">
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold">{selectedChat.remoteJid.split('@')[0]}</h3>
                                    <span className="text-xs text-gray-400">{selectedChat.isBotActive ? 'Bot respondendo' : 'Pausado para atendimento'}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleToggleBot}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${selectedChat.isBotActive ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`}
                            >
                                <Power size={18} />
                                {selectedChat.isBotActive ? 'Pausar Bot' : 'Reativar Bot'}
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 bg-opacity-95" style={{ backgroundImage: 'radial-gradient(#374151 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                            {loadingHistory ? (
                                <div className="flex justify-center p-10"><RefreshCw className="animate-spin text-green-500" /></div>
                            ) : (
                                history.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-lg text-sm ${msg.fromMe ? 'bg-green-700 text-white rounded-tr-none' : 'bg-gray-700 text-white rounded-tl-none'}`}>
                                            {/* Text Content */}
                                            {typeof msg.message?.conversation === 'string' && <p>{msg.message.conversation}</p>}
                                            {typeof msg.message?.extendedTextMessage?.text === 'string' && <p>{msg.message.extendedTextMessage.text}</p>}

                                            {/* Media placeholders if needed */}
                                            {(msg.message?.imageMessage) && <p className="italic text-gray-300">📸 [Imagem]</p>}
                                            {(msg.message?.audioMessage) && <p className="italic text-gray-300">🎤 [Áudio]</p>}

                                            <span className="text-[10px] text-gray-300 block text-right mt-1">
                                                {msg.timestamp ? new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            {history.length === 0 && !loadingHistory && (
                                <div className="text-center text-gray-500 mt-10">Histórico não disponível (Modo Proxy)</div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-800 flex gap-2">
                            <input
                                type="text"
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Digite uma mensagem..."
                                className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                                disabled={selectedChat.isBotActive}
                            />
                            <button
                                type="submit"
                                disabled={loading || !messageText.trim() || selectedChat.isBotActive}
                                className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                        {selectedChat.isBotActive && (
                            <div className="bg-yellow-900/30 text-yellow-500 text-xs text-center py-1">
                                Pause o bot para enviar mensagens manuais.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <Smartphone size={48} className="mb-4 opacity-50" />
                        <p>Selecione uma conversa para atender</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveChat;
