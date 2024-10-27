'use client';

import React, { useEffect, useState } from 'react';
import Auth from '@/components/auth';
import Chat from '@/components/chat';
// url of ws
const socketUrl = 'ws://localhost:8080';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userId, setUserId] = useState<string | null>(null); // ID клиента
    const [sessionId, setSessionId] = useState<string | null>(null); // ID сессии
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket(socketUrl);
        setWs(socket);

        socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
            setWs(null);
        };

        return () => {
            socket.close();
        };
    }, []);
// main control os websocket (for auth and chat)
    useEffect(() => {
        if (ws) {
            ws.onmessage = (event) => {
                const messageData = typeof event.data === 'string' ? event.data : '';
                const parsedMessage = JSON.parse(messageData);

                try {
                    if (parsedMessage.type === 'sessionId') {
                        setSessionId(parsedMessage.sessionId);
                    }
                } catch (e) {
                    console.log('Error parsing message', e);
                }
            };
        }
    }, [ws]);

    const handleLogin = (id: string) => {
        setIsAuthenticated(true);
        setUserId(id); 
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserId(null);
        setSessionId(null);
    };

    return (
        <div>
            <h1>Main chat page</h1>
            {isAuthenticated ? (
                <Chat ws={ws} setWs={setWs} onLogout={handleLogout} userId={userId} sessionId={sessionId} />
            ) : (
                <Auth ws={ws} onLogin={handleLogin} />
            )}
        </div>
    );
};

export default App;