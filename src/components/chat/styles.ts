'use client';

import {css, styled } from '@mui/system';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import TextField from '@mui/material/TextField';

export const ChatContainer = styled (Stack)`
    padding: 20px;
    background-color: #f0f0f0;
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