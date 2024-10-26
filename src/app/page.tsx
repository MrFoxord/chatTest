'use client';

import React, { useEffect, useState } from 'react';
import Auth from '@/components/auth';
import Chat from '@/components/chat';

const socketUrl = 'ws://localhost:8080';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    return (
        <div>
            <h1>Main chat page</h1>
            {isAuthenticated ? (
                <Chat ws={ws} onLogout={handleLogout} />
            ) : (
                <Auth ws={ws} onLogin={handleLogin} />
            )}
        </div>
    );
};

export default App;