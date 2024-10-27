'use client';

import {css, styled } from '@mui/system';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import TextField from '@mui/material/TextField';
import ListItemText from '@mui/material/ListItemText';

export const ChatContainer = styled (Stack)`
    padding: 20px;
    background-color: grey;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    margin: auto;
    display: flex;
    flex-direction: column;
    height: 100%;
`;

export const MessageList = styled(List)`
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 20px;
    flex-grow: 1;
`; 

export const StyledField = styled(TextField)`
    margin-bottom: 10px;
`;

export const StyledChatText = styled(ListItemText)`
    color: purple;
`;

export const AudioMessage = styled(Stack)`
    display: flex;
    align-items: center;
    margin: 8px 0;
    
    audio {
        margin-right: 8px;
    }
`;