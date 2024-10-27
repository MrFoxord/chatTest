import { type WebSocket as WServ } from 'ws';

export const handleDisconnect = (ws: WServ) => {
    console.log('Client disconnected');
};