import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const connectionString = process.env.MONGODB_URI;

const connectToMongoDB = async () => {
    await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log("connected to mongoDB");
    // const db = mongoose.connection;

    // Listen for successful connection

    // const collections = await db.db.listCollections().toArray();

    // // Print the names of all collections in the database
    // const collectionNames = collections.map((col) => col.name);
    // console.log("Collections in the database:", collectionNames);
};

export default connectToMongoDB;
