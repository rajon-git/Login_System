const {readdirSync}=require("fs");
const path=require("path");
const express=require("express");
const app=express()
const mongoose=require("mongoose")
const helmet=require("helmet")
const cors=require("cors")
const multer=require("multer")
const errorHandler=require("./middlewares/errorHandlerMiddleeware");
const morgan=require("morgan")
const cookieParser=require("cookie-parser")
require("dotenv").config()

//middleware implement

app.use(cors())
app.use(morgan("dev"))
app.use(helmet())
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:false}));

//routes implement

readdirSync("./routes").map(r=> app.use("/api/v1",require(`./routes/${r}`)));

//server
const port=process.env.PORT || 7000;
//CONNECT TO DB
mongoose.connect(process.env.DATABASE)
    .then(()=>{
        app.listen(port,()=>{
            console.log(`server is running on port ${port}`)
        });
    })
    .catch((error)=>console.log(error));