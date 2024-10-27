'use client';

import React, { useEffect, useState } from 'react';
import { AuthContainer, StyledInput, StyledButton, ErrorText } from './styles';

const Auth: React.FC<{ ws: WebSocket | null; onLogin: (clientId: string) => void }> = ({ ws, onLogin }) => {
    const [userName, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); 
    // ws requesting of server for needed data to login and registry
    useEffect(() => {
        if (ws) {
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'login' && message.status === 'ok') {
                    onLogin(message.clientId); 
                    setLoading(false); 
                } else if (message.type === 'register' && message.status === 'ok') {
                    onLogin(message.clientId); 
                    setLoading(false); 
                } else if (message.status === 'error') {
                    setError(message.error);
                    setLoading(false);
                }
            };
        }
    }, [ws, onLogin]);
// handlers
    const handleLogin = () => {
        setLoading(true);
        if (ws?.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'login',
                userName,
                password,
            });
            ws.send(message);
        } else {
            setError('WebSocket connection not established');
            setLoading(false); // Сброс загрузки
        }
    };

    const handleRegister = () => {
        setLoading(true); 
        if (ws?.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'register',
                userName,
                email,
                password,
            });
            ws.send(message);
        } else {
            setError('WebSocket connection not established');
            setLoading(false); // Сброс загрузки
        }
    };

    return (
        <AuthContainer>
            <h2>Authorization</h2>
            {error && <ErrorText>{error}</ErrorText>}
            <StyledInput
                label="UserName"
                value={userName}
                onChange={(e) => setUsername(e.target.value)}
            />
            <StyledInput
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <StyledInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <StyledButton onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </StyledButton>
            <StyledButton onClick={handleRegister} disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </StyledButton>
        </AuthContainer>
    );
};

export default Auth;