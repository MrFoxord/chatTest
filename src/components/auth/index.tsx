'use client';

import React, { useEffect, useState } from 'react';
import { AuthContainer, StyledInput, StyledButton, ErrorText } from './styles';

const Auth: React.FC<{ ws: WebSocket | null; onLogin: () => void }> = ({ ws, onLogin }) => {
    const [userName, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (ws) {
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'login' && message.status === 'ok') {
                    onLogin();
                } else if (message.type === 'register' && message.status === 'ok') {
                    onLogin();
                } else if (message.status === 'error') {
                    setError(message.error);
                }
            };
        }
    }, [ws, onLogin]);

    const handleLogin = () => {
        if (ws?.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'login',
                userName,
                password,
            });
            ws.send(message);
        } else {
            setError('WebSocket connection not established');
        }
    };

    const handleRegister = () => {
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
            <StyledButton onClick={handleLogin}>Login</StyledButton>
            <StyledButton onClick={handleRegister}>Register</StyledButton>
        </AuthContainer>
    );
};

export default Auth;