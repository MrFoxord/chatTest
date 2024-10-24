'use client';

import React, { useEffect, useState} from 'react';
import { Button, ListItem, List, ListItemText, TextField } from '@mui/material';
import { ChatContainer, MessageList, StyledField } from './styles';

const socketUrl='ws://localhost:8080';

export const Chat: React.FC = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    
    useEffect(()=>{
        const ws = new WebSocket(socketUrl);

        ws.onmessage = ( event ) => {
            setMessages((prev) =>[...prev,event.data]); 
        };

        return()=>{
            ws.close();
        }
    },[]);

    const sendMessage = ()=>{
        if(inputValue) {
            const ws = new WebSocket(socketUrl);
            ws.onopen=()=>{
                ws.send(inputValue);
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
                        <ListItemText primary={msg}/>
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