const mongoose=require("mongoose")
const bcrypt=require("bcryptjs");
const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please add your name"],
        trim:true,
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        match:[/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email"],
    },
    password:{
        type:String,
        required:[true,"Please add your email"],
        minLength:[6,"password must be more than 6 character"],
    },
    phone:{
        type:String,
        default:"+880",
    },
    photo:{
        type:String,
        default: "https://i.ibb.co/4pDNDk1/avatar.png",
        required:true,
    },
    bio:{
        type:String,
        maxLength:[300,"Bio must be less than 300 characters"],
        default:"Bio",
    },
},{timestamps:true,versionKey:false});

//after saving password in db ,hash password
userSchema.pre("save",async function (next){
    if(!this.isModified){
        return next();
    }
    //hashed password
    const salt=await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(this.password,salt);
    this.password=hashedPassword;
    next();
});
const User=mongoose.model("User",userSchema);
module.exports=User;