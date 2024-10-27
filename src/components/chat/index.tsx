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
    setWs: React.Dispatch<React.SetStateAction<WebSocket | null>>;
}

const Chat: React.FC<ChatProps> = ({ ws, onLogout, userId, sessionId }) => {
    const [chats, setChats] = useState<Chat[]>([{ name: 'main', messages: [] }]);
    const [activeChat, setActiveChat] = useState<string>('main');
    const [inputValue, setInputValue] = useState<string>('');
    const [newChatName, setNewChatName] = useState<string>('');
    const [newMemberName, setNewMemberName] = useState<string>('');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const MAX_MESSAGE_LENGTH = 200;
// initial ws requestings 
    useEffect(() => {
        if (ws) {
            ws.send(JSON.stringify({ type: 'history', chatName: activeChat, clientId: userId }));
            ws.send(JSON.stringify({ type: 'opening' }));

            ws.onmessage = (event) => {
                const messageData = typeof event.data === 'string' ? event.data : '';
                try {
                    const parsedMessage = JSON.parse(messageData);
                    handleIncomingMessage(parsedMessage);
                } catch (e) {
                    console.error('Error parsing message', e);
                }
            };
        }
    }, [ws, activeChat]);
// handlers for speaking client and server
    const handleIncomingMessage = (parsedMessage: any) => {
        switch (parsedMessage.type) {
            case 'chat-message':
            case 'audio-message':
                addMessageToChat(parsedMessage);
                break;
            case 'history':
                initializeChatHistory(parsedMessage);
                break;
            case 'new-chat':
                createNewChat(parsedMessage);
                break;
            case 'hello-connecting':
                handleHelloConnecting(parsedMessage);
                break;
            default:
                console.log('Unknown type of message', parsedMessage.type);
        }
    };

    const addMessageToChat = (parsedMessage: any) => {
        setChats(prevChats => prevChats.map(chat => {
            if (chat.name === parsedMessage.chatName) {
                document.title = `New message in ${chat.name}`;
                return {
                    ...chat,
                    messages: [...chat.messages, {
                        id: parsedMessage.clientId,
                        content: parsedMessage.content,
                        audioData: parsedMessage.audioData,
                        createdAt: parsedMessage.createdAt,
                    }]
                };
            }
            return chat;
        }));
    };

    const initializeChatHistory = (parsedMessage: any) => {
        const newChats: Chat[] = parsedMessage.messages.map((chat: any) => ({
            name: chat.chatName,
            messages: chat.messages.map((msg: any) => ({
                content: msg.content,
                audioData: msg.audioData,
                createdAt: msg.createdAt,
            }))
        }));
        setChats(newChats);
        if (!newChats.some(chat => chat.name === activeChat)) {
            setActiveChat(newChats[0]?.name || 'main');
        }
    };

    const createNewChat = (parsedMessage: any) => {
        setChats(prevChats => [...prevChats, {
            name: parsedMessage.chatName,
            messages: [],
        }]);
    };

    const handleHelloConnecting = (parsedMessage: any) => {
        const connectMessage: Message = {
            id: new Date().toISOString(),
            content: `${parsedMessage.clientId} has connected.`,
            createdAt: new Date().toISOString(),
        };
        setChats(prevChats => prevChats.map(chat => ({
            ...chat,
            messages: [...chat.messages, connectMessage]
        })));
    };

    const handleChatChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveChat(newValue);
        if (ws) {
            ws.send(JSON.stringify({ type: 'history', chatName: newValue }));
        }
    };

    const sendMessage = () => {
        if (inputValue.trim() === '') {
            console.error('Message cannot be empty');
            return;
        }
        if (inputValue.length > MAX_MESSAGE_LENGTH) {
            console.error(`Message exceeds the maximum length of ${MAX_MESSAGE_LENGTH} characters`);
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
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
            setInputValue(''); // Clear the input after sending
        } else {
            console.error('WebSocket is not connected');
        }
    };
// voice message play start and stop
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
// add new groupChat
    const createChat = () => {
        if (newChatName.trim() === '') return;

        const newChat: Chat = { name: newChatName, messages: [] };
        setChats(prevChats => [...prevChats, newChat]);
        setActiveChat(newChatName);
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

    const addMemberToGroup = () => {
        if (newMemberName.trim() === '' || !activeChat) {
            console.error('Missing newMemberName or activeChat');
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            const invitePayload = {
                type: 'add-member-to-group',
                chatName: activeChat,
                newMemberName: newMemberName,
                clientId: userId,
                sessionId: sessionId,
            };

            ws.send(JSON.stringify(invitePayload));
            setNewMemberName('');
        } else {
            console.error('WebSocket is not connected');
        }
    };

    return (
        <ChatContainer>
            <h2>Chat</h2>
            <div>
                <Tabs value={activeChat} onChange={handleChatChange}>
                    {chats.map(chat => (
                        <Tab key={chat.name} label={chat.name} value={chat.name} />
                    ))}
                </Tabs>
                <div>
                    <TextField
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message"
                    />
                    <Button onClick={sendMessage}>Send</Button>
                    <IconButton onClick={isRecording ? stopRecording : startRecording}>
                        {isRecording ? <Stop /> : <PlayArrow />}
                    </IconButton>
                </div>
                <MessageList>
                    {chats.find(chat => chat.name === activeChat)?.messages.map((message, index) => (
                        <ListItem key={index}>
                            {message.content && <StyledChatText>{message.content}</StyledChatText>}
                            {message.audioData && (
                                <AudioMessage onClick={() => playAudio(message.audioData)}>
                                    🎵 Play Audio
                                </AudioMessage>
                            )}
                        </ListItem>
                    ))}
                </MessageList>
                <div>
                    <TextField
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        placeholder="New chat name"
                    />
                    <Button onClick={createChat}>Create Chat</Button>
                    <TextField
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="New member name"
                    />
                    <Button onClick={addMemberToGroup}>Add Member</Button>
                </div>
                <Button onClick={onLogout}>Logout</Button>
            </div>
        </ChatContainer>
    );
};

export default Chat;