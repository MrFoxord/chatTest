'use client';

import { styled } from '@mui/system';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';


export const AuthContainer = styled(Stack)`
    padding: 20px;
    background-color: #f0f0f0;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    margin: auto;
    display: flex;
    flex-direction: column;
`;

export const StyledInput = styled(TextField)`
    margin-bottom: 10px;
`;

export const StyledButton = styled(Button)`
    margin-top: 10px;
`;

export const ErrorText = styled('p')`
    color: red;
    margin-bottom: 10px;
`;