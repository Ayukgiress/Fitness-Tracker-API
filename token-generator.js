// import { google } from 'googleapis';
// import express from 'express';
// import open from 'open';
// import dotenv from 'dotenv';

// dotenv.config();

// const app = express();
// const port = 3001;

// // Configure OAuth2 client
// const oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     `http://localhost:${port}/oauth2callback`
// );

// // Generate authentication URL
// const scopes = [
//     'https://mail.google.com/',
//     'https://www.googleapis.com/auth/gmail.send',
//     'https://www.googleapis.com/auth/gmail.modify'
// ];

// const authorizationUrl = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: scopes,
//     include_granted_scopes: true
// });

// // Setup express routes
// app.get('/oauth2callback', async (req, res) => {
//     const { code } = req.query;
    
//     try {
//         // Exchange authorization code for tokens
//         const { tokens } = await oauth2Client.getToken(code);
        
//         console.log('\nYour refresh token is:\n', tokens.refresh_token);
//         console.log('\nYour access token is:\n', tokens.access_token);
//         console.log('\nAdd these to your .env file as:\n');
//         console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
//         console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
        
//         res.send('Tokens retrieved successfully! You can close this window and check your console.');
        
//         // Close the server after tokens are retrieved
//         setTimeout(() => process.exit(0), 1000);
        
//     } catch (error) {
//         console.error('Error retrieving tokens:', error);
//         res.status(500).send('Error retrieving tokens');
//     }
// });

// // Start server and open authorization URL
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
//     console.log('Opening Google authorization page...');
//     open(authorizationUrl);
// });