import mongoose from 'mongoose';

export const createCollectionIfNotExists = async (collectionNames: string[]) => {
    const db = mongoose.connection.db;
    if (db) {
        const collections = await db.listCollections().toArray();
        const existingCollections = collections.map((col) => col.name);

        for (const collectionName of collectionNames) {
            if (!existingCollections.includes(collectionName)) {
                console.log(`Creating collection ${collectionName}`);
                await mongoose.connection.db?.createCollection(collectionName);
            } else {
                console.log(`Collection ${collectionName} already exists`);
            }
        }
    } else {
        console.error('MongoDB connection is not established or db is undefined.');
    }
};