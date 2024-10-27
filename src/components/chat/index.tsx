import React, { useEffect, useState } from 'react';
import { Button, ListItem, TextField, IconButton, Tabs, Tab } from '@mui/material';
import { PlayArrow, Stop, RecordVoiceOver } from '@mui/icons-material';
import { ChatContainer, MessageList, StyledChatText, AudioMessage } from './styles';

interface Message {
    id: string;
    content?: string;
    audioData?: string;
    createdAt: string;
}

interface Chat {
    name: string;
    messages: Message[];
}

interface ChatProps {
    ws: WebSocket | null;
    onLogout: () => void;
    userId: string | null;
    sessionId: string | null;
}

const Chat: React.FC<ChatProps> = ({ ws, onLogout, userId, sessionId }) => {
    const [chats, setChats] = useState<Chat[]>([{ name: 'main', messages: [] }]);
    const [activeChat, setActiveChat] = useState<string>('main'); // Ensure this is 'main'
    const [inputValue, setInputValue] = useState<string>('');
    const [newChatName, setNewChatName] = useState<string>('');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);

    useEffect(() => {
        if (ws) {
            ws.send(JSON.stringify({ type: 'history', chatName: activeChat, clientId: userId }));

            ws.onmessage = (event) => {
                const messageData = typeof event.data === 'string' ? event.data : '';
                try {
                    const parsedMessage = JSON.parse(messageData);
                    switch (parsedMessage.type) {
                        case 'chat-message':
                            setChats(prevChats => prevChats.map(chat => {
                                if (chat.name === parsedMessage.chatName) {
                                    return {
                                        ...chat,
                                        messages: [...chat.messages, {
                                            id: parsedMessage.clientId,
                                            content: parsedMessage.content,
                                            createdAt: parsedMessage.createdAt,
                                        }]
                                    };
                                }
                                return chat;
                            }));
                            break;
                        case 'audio-message':
                            setChats(prevChats => prevChats.map(chat => {
                                if (chat.name === parsedMessage.chatName) {
                                    return {
                                        ...chat,
                                        messages: [...chat.messages, {
                                            id: parsedMessage.clientId,
                                            audioData: parsedMessage.audioData,
                                            createdAt: parsedMessage.createdAt,
                                        }]
                                    };
                                }
                                return chat;
                            }));
                            break;
                        case 'history':
                            const newChats: Chat[] = parsedMessage.messages.map((chat: any) => ({
                                name: chat.chatName,
                                messages: chat.messages.map((msg: any) => ({
                                    content: msg.content,
                                    audioData: msg.audioData,
                                    createdAt: msg.createdAt,
                                }))
                            }));
                            setChats(newChats);
                            // Ensure activeChat is valid after fetching history
                            if (!newChats.some(chat => chat.name === activeChat)) {
                                setActiveChat(newChats[0]?.name || 'main'); // Reset to first chat if not valid
                            }
                            break;
                        case 'new-chat':
                            setChats(prevChats => [...prevChats, {
                                name: parsedMessage.chatName,
                                messages: [],
                            }]);
                            break;
                        default:
                            console.log('Unknown type of message', parsedMessage.type);
                    }
                } catch (e) {
                    console.log('Error parsing message', e);
                }
            };
        }
    }, [ws, activeChat]);

    const handleChatChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveChat(newValue);
        if (ws) {
            ws.send(JSON.stringify({ type: 'history', chatName: newValue })); // Load history for the selected chat
        }
    };

    const sendMessage = () => {
        if (inputValue && ws && ws.readyState === WebSocket.OPEN) {
            const messageId = new Date().toISOString();
            const messagePayload = {
                type: 'chat-message',
                content: inputValue,
                chatName: activeChat,
                clientId: userId,
                sessionId: sessionId,
            };
            const newMessage: Message = {
                id: messageId,
                content: inputValue,
                createdAt: messageId,
            };

            setChats(prevChats => prevChats.map(chat => chat.name === activeChat ? { ...chat, messages: [...chat.messages, newMessage] } : chat));
            ws.send(JSON.stringify(messagePayload));
            setInputValue('');
        } else {
            console.error('WebSocket is not connected');
        }
    };

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
                        chatName: activeChat,
                        clientId: userId,
                        sessionId: sessionId,
                    };
    
                    const newAudioMessage: Message = {
                        id: messageId,
                        audioData: base64AudioMessage,
                        createdAt: messageId,
                    };
                    
                    setChats(prevChats => prevChats.map(chat => chat.name === activeChat ? { ...chat, messages: [...chat.messages, newAudioMessage] } : chat));
                    ws.send(JSON.stringify(messagePayload));
                }
    
                setIsRecording(false);
            };
        };
    
        recorder.start();
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
    };

    const playAudio = (base64AudioData: string | undefined) => {
        if (!base64AudioData) {
            console.error('Audio data is undefined');
            return;
        }

        const audioBlob = new Blob([Uint8Array.from(atob(base64AudioData.split(',')[1]), c => c.charCodeAt(0))], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => URL.revokeObjectURL(audioUrl);
    };

    const createChat = () => {
        if (newChatName.trim() === '') return;

        const newChat: Chat = { name: newChatName, messages: [] };
        setChats(prevChats => [...prevChats, newChat]);
        setActiveChat(newChatName); // Set active chat to the newly created chat
        setNewChatName('');

        if (ws && ws.readyState === WebSocket.OPEN) {
            const messagePayload = {
                type: 'create-group-chat',
                chatName: newChatName,
                clientId: userId,
                sessionId: sessionId,
            };

            ws.send(JSON.stringify(messagePayload));
        }
    };

    return (
        <ChatContainer>
            <h2>Chat</h2>
            <Tabs value={activeChat} onChange={handleChatChange}>
                {chats.map((chat, idx) => (
                    <Tab key={idx} label={chat.name} value={chat.name} />
                ))}
            </Tabs>

            <TextField
                label='New Chat Name'
                variant='outlined'
                fullWidth
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
            />
            <Button variant='contained' onClick={createChat}>Create Chat</Button>

            <MessageList>
                {chats.find(chat => chat.name === activeChat)?.messages.map((message, idx) => (
                    <ListItem key={idx}>
                        {message.audioData ? (
                            <AudioMessage>
                                <IconButton onClick={() => playAudio(message.audioData)}>
                                    <PlayArrow />
                                </IconButton>
                            </AudioMessage>
                        ) : (
                            <StyledChatText>{message.content}</StyledChatText>
                        )}
                    </ListItem>
                ))}
            </MessageList>

            <TextField
                label='Type your message'
                variant='outlined'
                fullWidth
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
            />
            <Button onClick={sendMessage}>Send</Button>
            <IconButton onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? <Stop /> : <RecordVoiceOver />}
            </IconButton>

            <Button onClick={onLogout}>Logout</Button>
        </ChatContainer>
    );
};

export default Chat;