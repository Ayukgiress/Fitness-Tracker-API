import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // You can include connectTimeoutMS if needed
      connectTimeoutMS: 30000, // Increase timeout to 30 seconds
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;






// import { MongoClient, ServerApiVersion } from 'mongodb';  

// const uri = "mongodb+srv://giress865:tGTBcZzZUgvmF8Ck@fittrackdb.ekwbi.mongodb.net/?retryWrites=true&w=majority&appName=fittrackDB";  

// // Create a MongoClient  
// const client = new MongoClient(uri, {  
//   serverApi: {  
//     version: ServerApiVersion.v1,  
//     strict: true,  
//     deprecationErrors: true,  
//   },  
// });  

// // Function to connect to the database  
// export const connectDB = async () => {  
//   try {  
//     // Connect the client to the server  
//     await client.connect();  
//     // Send a ping to confirm a successful connection  
//     await client.db("admin").command({ ping: 1 });  
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");  
//   } catch (error) {  
//     console.error('MongoDB connection error:', error);  
//     process.exit(1); // Optional: exit the process if there's a connection error  
//   }  
// };  

// export default client;





// import mongoose from 'mongoose';

// const connectDB = async () => {
//     try {
//         const uri = process.env.MONGO_URI; 
//         if (!uri) {
//             throw new Error("MONGO_URI is not defined in the environment variables.");
//         }
//         await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//         console.log('MongoDB connected...');
//     } catch (error) {
//         console.error('MongoDB connection error:', error);
//         process.exit(1);
//     }
// };

// export default connectDB;
