'use client';

import React, { useEffect, useState} from 'react';
import { Button, ListItem, List, TextField } from '@mui/material';
import { ChatContainer, MessageList, StyledField, StyledChatText } from './styles';

const socketUrl='ws://localhost:8080';

interface Message {
    content: string;
    chatName: string;
}

export const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    
    useEffect(()=>{
        const ws = new WebSocket(socketUrl);

        ws.onmessage =  ( event ) => {

            const messageData = typeof event.data === 'string' ? event.data : '';

            try {
                const parsedMessage = JSON.parse(messageData);
                 switch(parsedMessage.type) {
                    case 'chat-message':
                        console.log('Recieved message', parsedMessage);
                        setMessages((prev) => [...prev, { content: parsedMessage.content, chatName: parsedMessage.chatName }]);
                        break;
                    case 'history':
                        console.log('Received history:', parsedMessage.messages);
                        setMessages(parsedMessage.messages);
                        break;
                        
                    default:
                        console.log('Unknown type of message', parsedMessage.type);
                 }
            } catch (e) {
                console.log(e);
            }
        };

        const handleBeforeUnload = () => {
            if(ws) {
                ws.send(JSON.stringify({type: 'disconnect' } ) );
                ws.close();
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload);
        return()=>{
            if(ws) {
                ws.send(JSON.stringify({ type: 'disconnect' }));
                ws.close();
            }
            window.removeEventListener('beforeunload',handleBeforeUnload);
        }
    },[]);

    const sendMessage = ()=>{
        console.log('try send');
        if(inputValue) {
            const ws = new WebSocket(socketUrl);
            ws.onopen=()=>{
                const messagePayload = {
                    type: 'chat-message',
                    content: inputValue,
                    chatName: 'main',
                }
                ws.send(JSON.stringify(messagePayload));
                setInputValue('');
            }
        }
    }

    return(
        <ChatContainer>
            <h2> Chat test</h2>
            <MessageList>
                {messages.map((msg,index)=>(
                    <ListItem key={index}>
                        <StyledChatText primary={msg.content} secondary={msg.chatName}/>
                    </ListItem>
                ))}
            </MessageList>
            <TextField
                label='Type message'
                variant='outlined'
                fullWidth
                value={inputValue}
                onChange={(e)=>{setInputValue(e.target.value)}}
            />
            <Button 
                variant='outlined'
                color='primary'
                onClick={sendMessage}
            >
                Send
            </Button>
        </ChatContainer>
        );
};

export default Chat;