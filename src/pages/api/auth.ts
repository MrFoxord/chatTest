import type { NextApiRequest, NextApiResponse } from "next";
import Client from "@/models/clients";

export default async function handler( req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'POST') {
        const {name, password} = req.body;

        try {
            const client = await Client.findOne({name, password});
            if(!client) {
                return res.status(401).json({ message: 'Invalid cretendials'});
            }

            return res.status(401).json({message: 'Login successfull'});
        } catch (e) {
            return res.status(500).json({message: 'Server error'});
        }
    }
    else {
        res.setHeader('Allow',['POST']);
        return res.status(405).end(` Method ${req.method} Not Allowed`);
    }
}