'use client';

import React, { useEffect, useState } from 'react';
import Auth from '@/components/auth';
import Chat from '@/components/chat';

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
        // @ts-ignore
         

        socket.onclose = () => {
            console.log('WebSocket connection closed');
            setWs(null);
        };

        return () => {
            socket.close();
        };
    }, []);

    useEffect(()=>{
        console.log('pros paa ws');
        if(ws) {ws.onmessage = (event) => {
            console.log('proc app message')
            const messageData = typeof event.data === 'string' ? event.data : '';
            const parsedMessage = JSON.parse(messageData);

            try {
                console.log('we have message', parsedMessage);
                if (parsedMessage.type === 'sessionId') {
                        setSessionId(parsedMessage.sessionId);
                }
            } catch (e) {
                console.log('Error parsing message', e);
            }
        };}
    },[ws]);

    useEffect(() => {
        console.log('app sessionId is', sessionId);
    }, [sessionId]);

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
                <Chat ws={ws} onLogout={handleLogout} userId={userId} sessionId={sessionId} />
            ) : (
                <Auth ws={ws} onLogin={handleLogin}/>
            )}
        </div>
    );
};

export default App;