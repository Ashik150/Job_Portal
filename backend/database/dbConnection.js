import mongoose from 'mongoose';

const connectDatabase = async () => {
    try {
        const con = await mongoose.connect('mongodb://localhost:27017/job');
        console.log(`MongoDB connected`);
    } catch (err) {
        console.log("Error: ", err.message);
        process.exit(1);
    }
}

export default connectDatabase;