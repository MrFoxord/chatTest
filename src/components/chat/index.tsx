'use client';

import React, { useEffect, useState } from 'react';
import { Button, ListItem, TextField, IconButton } from '@mui/material';
import { PlayArrow, Stop, RecordVoiceOver } from '@mui/icons-material';
import { ChatContainer, MessageList, StyledChatText, AudioMessage } from './styles';

// Интерфейс для сообщения
interface Message {
    id: string;
    content?: string;
    chat: string;
    audioData?: string;
    createdAt?: string;
    status?: 'sent' | 'error' | null;
}

// Пропсы компонента Chat
interface ChatProps {
    ws: WebSocket | null;
    onLogout: () => void;
    userId: string | null; // ID пользователя
    sessionId: string | null;
}

const Chat: React.FC<ChatProps> = ({ ws, onLogout, userId, sessionId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);

    // Эффект для обработки WebSocket сообщений
    useEffect(() => {
        if (ws) {
            ws.send(JSON.stringify({ type: 'history', chatName: 'main' }));
            ws.onmessage = (event) => {
                const messageData = typeof event.data === 'string' ? event.data : '';
                try {
                    const parsedMessage = JSON.parse(messageData);
                    console.log('parsed message', parsedMessage);
                    switch (parsedMessage.type) {
                        case 'chat-message':
                            setMessages((prev) => [
                                ...prev,
                                {      
                                    id: parsedMessage.clientId,
                                    content: parsedMessage.content,
                                    chat: parsedMessage.chatName,
                                    createdAt: parsedMessage.createdAt,
                                }
                            ]);
                            break;
                        case 'audio-message':
                            setMessages((prev) => [
                                ...prev,
                                {
                                    id: parsedMessage.clientId,
                                    audioData: parsedMessage.audioData,
                                    chat: parsedMessage.chatName,
                                    createdAt: parsedMessage.createdAt,
                                }
                            ]);
                            break;
                        case 'error-message':
                            setMessages((prev) =>
                                prev.map(msg =>
                                    msg.id === parsedMessage.id ? { ...msg, status: 'error' } : msg
                                )
                            );
                            break;
                        case 'history':
                            const historyMessages: Message[] = parsedMessage.messages.map((msg: any) => ({
                                content: msg.content,
                                audioData: msg.audioData,
                                chat: msg.chatName,
                                createdAt: msg.createdAt,
                            }));
                            setMessages(historyMessages);
                            break;
                        default:
                            console.log('Unknown type of message', parsedMessage.type);
                    }
                } catch (e) {
                    console.log('Error parsing message', e);
                }
            };
        }
    }, [ws]);

    useEffect(()=>{
        console.log('sessionId is', sessionId);
    },[sessionId])

    // Отправка текстового сообщения
    const sendMessage = () => {
        if (inputValue && ws && ws.readyState === WebSocket.OPEN) {
            const messageId = new Date().toISOString();
            const messagePayload = {
                type: 'chat-message',
                content: inputValue,
                chatName: 'main',
                clientId: userId,
                sessionId: sessionId,
            };
    
            const newMessage: Message = {
                id: messageId,
                content: inputValue,
                chat: 'main',
                status: 'sent',
                createdAt: messageId,
                 
            };
            setMessages((prev) => [...prev, newMessage]);
    
            ws.send(JSON.stringify(messagePayload));
            setInputValue(''); // Очищаем поле ввода
        } else {
            console.error('WebSocket is not connected');
        }
    };

    // Начало записи аудио
    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        setIsRecording(true);

        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        recorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);

            reader.onloadend = () => {
                const base64AudioMessage = reader.result?.toString();

                if (base64AudioMessage && ws && ws.readyState === WebSocket.OPEN) {
                    const messageId = new Date().toISOString();
                    const messagePayload = {
                        type: 'audio-message',
                        audioData: base64AudioMessage,
                        chatName: 'main',
                        clientId: userId,
                        sessionId: sessionId, 
                    };

                    const newAudioMessage: Message = {
                        id: messageId,
                        audioData: base64AudioMessage,
                        chat: 'main',
                        status: 'sent',
                        createdAt: messageId, 
                    };
                    setMessages((prev) => [...prev, newAudioMessage]);

                    ws.send(JSON.stringify(messagePayload));
                }

                setIsRecording(false); // Сбрасываем состояние записи
            };
        };

        recorder.start(); // Начинаем запись
    };

    // Остановка записи аудио
    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
    };

    // Воспроизведение аудио
    const playAudio = (base64AudioData: string | undefined) => {
        if (!base64AudioData) {
            console.error('Audio data is undefined');
            return;
        }

        const audioBlob = new Blob([Uint8Array.from(atob(base64AudioData.split(',')[1]), c => c.charCodeAt(0))], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => URL.revokeObjectURL(audioUrl); // Освобождаем URL после завершения воспроизведения
    };

    return (
        <ChatContainer>
            <h2>Chat</h2>
            <MessageList>
                {messages.map((msg, idx) => (
                    <ListItem key={idx}>
                        {msg.content ? (
                            <>
                                <StyledChatText primary={msg.content} secondary={msg.chat} />
                                <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : "00:00"}</span>
                                <span>{msg.status === 'sent' ? 'Sent' : msg.status === 'error' ? 'Error' : ''}</span>
                            </>
                        ) : (
                            <AudioMessage>
                                <IconButton onClick={() => playAudio(msg.audioData)}>
                                    <PlayArrow />
                                </IconButton>
                                <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : "00:00"}</span>
                                <span>{msg.status === 'sent' ? 'Sent' : msg.status === 'error' ? 'Error' : ''}</span>
                            </AudioMessage>
                        )}
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
            <Button variant='outlined' color='primary' onClick={sendMessage}>
                Send
            </Button>
            <Button variant='outlined' color='secondary' onClick={onLogout}>
                Logout
            </Button>
            <Button variant='outlined' onClick={startRecording} disabled={isRecording}>
                <RecordVoiceOver /> Start Recording
            </Button>
            <Button variant='outlined' onClick={stopRecording} disabled={!isRecording}>
                <Stop /> Stop Recording
            </Button>
        </ChatContainer>
    );
};

export default Chat;