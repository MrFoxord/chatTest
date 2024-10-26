'use client';

import React, { useEffect, useState } from 'react';
import { Button, ListItem, TextField } from '@mui/material';
import { ChatContainer, MessageList, StyledChatText } from './styles';

interface Message {
    content: string;
    chatName: string;
}

interface ChatProps {
    ws: WebSocket | null;
    onLogout: () => void;
}

const Chat: React.FC<ChatProps> = ({ ws, onLogout }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');

    useEffect(() => {
        if (ws) {
            // Отправляем запрос на получение истории сообщений при монтировании компонента
            const fetchHistory = () => {
                const messagePayload = {
                    type: 'history',
                    count: 20, // Количество сообщений, которые мы хотим получить
                };
                ws.send(JSON.stringify(messagePayload));
            };

            // Устанавливаем обработчик для получения сообщений
            ws.onmessage = (event) => {
                const messageData = typeof event.data === 'string' ? event.data : '';
                try {
                    const parsedMessage = JSON.parse(messageData);
                    switch (parsedMessage.type) {
                        case 'chat-message':
                            setMessages((prev) => [...prev, { content: parsedMessage.content, chatName: parsedMessage.chatName }]);
                            break;
                        case 'history':
                            setMessages(parsedMessage.messages); // Получаем сообщения из истории
                            break;
                        default:
                            console.log('Unknown type of message', parsedMessage.type);
                    }
                } catch (e) {
                    console.log('Error parsing message', e);
                }
            };

            // Запрашиваем историю сообщений
            fetchHistory();
        }
    }, [ws]);

    const sendMessage = () => {
        if (inputValue && ws && ws.readyState === WebSocket.OPEN) {
            const messagePayload = {
                type: 'chat-message',
                content: inputValue,
                chatName: 'main',
            };
            ws.send(JSON.stringify(messagePayload));
            setInputValue('');
        } else {
            console.error('WebSocket is not connected');
        }
    };

    return (
        <ChatContainer>
            <h2>Chat</h2>
            <MessageList>
                {messages.map((msg, index) => (
                    <ListItem key={index}>
                        <StyledChatText primary={msg.content} secondary={msg.chatName} />
                    </ListItem>
                ))}
            </MessageList>
            <TextField
                label='Type message'
                variant='outlined'
                fullWidth
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
            />
            <Button
                variant='outlined'
                color='primary'
                onClick={sendMessage}
            >
                Send
            </Button>
            <Button
                variant='outlined'
                color='secondary'
                onClick={onLogout}
            >
                Logout
            </Button>
        </ChatContainer>
    );
};

export default Chat;