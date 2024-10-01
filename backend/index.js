// import express, { text, urlencoded } from 'express'
// import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'

// import ImageKit from "imagekit";
// import cors from 'cors'
// import mongoose from 'mongoose';

// import Chat from './models/chat.js';

// import UserChats from './models/userChats.js';
// const app = express()

// const PORT = process.env.PORT || 3000

// const imagekit = new ImageKit({
//   urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
//   publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
//   privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
// });


// app.use(cors({
//   origin: true, // Allows all origins
//   credentials: true // Enables credentials
// }));

// app.use(express.json())

// app.get('/api/upload',(req,res)=>{
// const result = imagekit.getAuthenticationParameters();
//   res.send(result);
// })
// console.log('ljlbh')
// app.post('/api/chats',  ClerkExpressRequireAuth(), async (req,res)=>{
//   console.log('ljlbh')
//   const userId = req.auth.userId;
//   const {text} = req.body
//    console.log('userid',userId,'texttt',text)
//   try {

//     const newChat = await new Chat({
//       userId ,
//      history:[{role:"user", parts: [{text}]}]

//     })

//     const savedChat = await newChat.save()

//     const userChats = await UserChats.find({userId})

//     if(!userChats.length) {
//       const newUserChats = new UserChats({
//         userId,
//         chats: [
//           {
//             _id: savedChat._id,
//             title: text.substring(0,40),
//           },
//         ]
//       })
//       await newUserChats.save()
//     }else {
//       await UserChats.updateOne({
//         userId }, {
//             $push : {
//               chats: {
//                  _id : savedChat._id,
//                  title: text.substring(0,40),
//               }
//         }
//       })

//       res.status(201).send(newChat._id)
//     }

//   } catch (err) {
//     console.log(err)
//     res.status(500).send("Error creating chat")
//   }

// })

// app.get('/api/userchats',ClerkExpressRequireAuth(), async (req,res)=>{
//  const userId = req.auth.userId
   
//  try {
 
//    const userChats = await UserChats.find({userId})

//    res.status(200).send(userChats[0].chats)
//  } catch (err) {
//   console.log(err)
//   res.status(500).send("Error fetchning user chats!")
//  }
// })

// app.get('/api/chats/:id',ClerkExpressRequireAuth(), async (req,res)=>{
//  const userId = req.auth.userId
//    console.log('hducdcnj',userId)
//    console.log('iddd',req.params.id)

//  try {
//    const chat = await Chat.findOne({ userId})
//   console.log('chat',chat)
//    res.status(200).send(chat)
//  } catch (err) {
//   console.log(err)
//   res.status(500).send("Error fetchning user chats!")
//  }
// })


// app.put('/api/chats/:id',ClerkExpressRequireAuth(), async (req,res)=>{
//    const {question, answer, img} = req.body

//    const newItems = [
//     ...(question ?
//       [ {role: "user", parts : [{text: question}],...(img && {img})}]:[]
//     ),
//     {role : "model", parts: [{text: answer}]}
//    ]

//    try {
//     const updatedChat = await Chat.updateOne(
//       {_id: req.params.id, userId},
//       {
//         $push : {
//           history :{
//             $each : newItems
//           }
//         }
//       }
//     )
//     res.status(200).send(updatedChat)
//    } catch (err) {
//     console.log(err)
//      res.status(500).send("Error adding conversation")
//    }
// })

// app.use((err, req, res, next) => {
//   console.error(err.stack)
//   res.status(401).send('Unauthenticated!')
// })

// app.listen(PORT,()=>{
//   try {
//     mongoose.connect(process.env.MONGO_URI)
//     console.log('connected to mongodb')
//   }
//   catch(error){
//     console.log(error)
//   }
// })

import express from "express";
import cors from "cors";
import path from "path";
import url, { fileURLToPath } from "url";
import ImageKit from "imagekit";
import mongoose from "mongoose";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

import dotenv from 'dotenv'
// const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__filename)

app.use(
  cors({
     origin: 'http://localhost:5173',
    credentials: true,
  })
);





app.use(express.json());

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
  }
};

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

app.get("/api/upload", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { text } = req.body;

  try {
    // CREATE A NEW CHAT
    const newChat = new Chat({
      userId: userId,
      history: [{ role: "user", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();

    // CHECK IF THE USERCHATS EXISTS
    const userChats = await UserChats.find({ userId: userId });

    // IF DOESN'T EXIST CREATE A NEW ONE AND ADD THE CHAT IN THE CHATS ARRAY
    if (!userChats.length) {
      const newUserChats = new UserChats({
        userId: userId,
        chats: [
          {
            _id: savedChat._id,
            title: text.substring(0, 40),
          },
        ],
      });

      await newUserChats.save();
    } else {
      // IF EXISTS, PUSH THE CHAT TO THE EXISTING ARRAY
      await UserChats.updateOne(
        { userId: userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text.substring(0, 40),
            },
          },
        }
      );

      res.status(201).send(newChat._id);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating chat!");
  }
});

app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const userChats = await UserChats.find({ userId });

    res.status(200).send(userChats[0]?.chats);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching userchats!");
  }
});

app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId });

    res.status(200).send(chat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching chat!");
  }
});

app.put("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  const { question, answer, img } = req.body;
  console.log('123456')
  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

//   const newItems = [
//     { 
//       role: "user", 
//       parts: [{ text: question || "Default question" }], // Ensure "user" role is always included, even if question is falsy
//       ...(img && { img })  // Include img if it's provided
//     },
//     { 
//       role: "model", 
//       parts: [{ text: answer }]  // Ensure "model" role is always present with the answer
//     }
// ];
console.log('new items',newItems)

  try {
    const updatedChat = await Chat.updateOne(
      { _id: req.params.id, userId },
      {
        $push: {
          history: {
            $each: newItems,
          },
        },
      }
    );
    res.status(200).send(updatedChat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding conversation!");
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(401).send("Unauthenticated!");
});

// PRODUCTION
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

app.listen(port, () => {
  connect();
  console.log("Server running on 3000");
});