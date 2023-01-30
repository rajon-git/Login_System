const User=require("../models/user");
const asyncHandler=require("express-async-handler");
const crypto=require("crypto")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const Token=require("../models/token");
const sendEmail=require("../utlis/sendEmail");

const generateToken=(id)=> {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "7d"})
}
//register user
const registerUser=asyncHandler(async (req,res)=>{
    const {name,email,password}=req.body;
    //check validation
    if(!name||!email||!password){
        res.status(400);
        throw new Error("Please fillup required options");
    }
    if(password.length<6){
        res.status(400);
        throw new Error("Password must be more than 6 character ");
    }
    //if email alreday exists
    const userExists=await User.findOne({email});
    if(userExists){
        res.status(400);
        throw new Error("This email alreday exists");
    }
    //create new user
    const user=await User.create({
        name,
        email,
        password,
    });
    //create token for new user
    const token=generateToken(user._id);

    //send token in user cookies
    res.cookie("token",token,{
        path:"/",
        httpOnly:true,
        expires:new Date(Date.now()+1000*86400*7), //7d
        sameSite:"none",
        //secure:true,
    });
    if(user){
        const {_id,name,email,password,phone,photo,bio}=user;
        res.status(201).json({
            _id,
            name,
            email,
            phone,
            photo,
            bio,
            token,
        })
    }else{
        res.status(400);
        throw new Error("Invalid user data");
    }
});

//login user
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate Request
    if (!email || !password) {
        res.status(400);
        throw new Error("Please add email and password");
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
        res.status(400);
        throw new Error("User not found, please signup");
    }

    // User exists, check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    //   Generate Token
    const token = generateToken(user._id);

    // Send HTTP-only cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        // secure: true,
    });

    if (user && passwordIsCorrect) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(200).json({
            _id,
            name,
            email,
            photo,
            phone,
            bio,
            token,
        });
    } else {
        res.status(400);
        throw new Error("Invalid email or password");
    }
});

//logout user
const logoutUser=asyncHandler(async (req,res)=>{
    res.cookie("token","",{
        path:"/",
        httpOnly:true,
        //secure:true,
        sameSite:"none",
        expires:new Date(0)
    });
    return res.status(200).json({message:"logout successfully"});
})
//get user
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(200).json({
            _id,
            name,
            email,
            photo,
            phone,
            bio,
        });
    } else {
        res.status(400);
        throw new Error("User Not Found");
    }
});
//login status
const loginStatus=asyncHandler(async (req,res)=>{
    const token=req.cookies.token;
    if(!token){
        return res.json(false);
    }
    //verify the token if have a token
    const verified=jwt.verify(token,process.env.JWT_SECRET);
    if(verified){
        return res.json(true);
    }
    return res.json(false);
});

//user update
const updateUser=asyncHandler(async (req,res)=>{
    const user=await User.findById(req.user._id)
    if(user){
        const {name,email,phone,photo,bio}=user;
        user.email=email;
        user.name=req.body.name||name;
        user.phone=req.body.phone||phone;
        user.photo=req.body.photo||photo;
        user.bio=req.body.bio||bio;
        const updateuser=await user.save();
        res.status(200).json({
            _id:updateuser._id,
            email:updateuser.email,
            name:updateuser.name,
            photo:updateuser.photo,
            phone:updateuser.phone,
            bio:updateuser.bio,
        });
    }else{
        res.status(400);
        throw new Error("User not found");
    }
})

//change password
const changePassword=asyncHandler(async (req,res)=>{
    const user=await User.findById(req.user._id)
    const {oldpassword,password}=req.body;
    if(!user){
        res.status(400);
        throw new Error("Please login");
    }
    //check validation
    if(!oldpassword|| !password){
        res.status(400);
        throw new Error("Please fill all required options");
    }
    //check oldpassword and db password is same
    const correctPassword=await bcrypt.compare(oldpassword,user.password);
    //now save new password in db
    if(user && correctPassword){
        user.password=password;
        await user.save();
        res.status(200).send("Password change successfully")
    }else{
        res.status(400);
        throw new Error("Old password is incorrect");
    }
});
//forgot user password
const forgotPassword=asyncHandler(async (req,res)=>{
    const {email}=req.body;
    const user=await User.findOne({email});
    if(!user){
        res.status(401);
        throw new Error("User not found");
    }
    //delete token if already exists
    const token=await Token.findOne({userId:user._id});
    if(token){
        await token.deleteOne();
    }
    //create reset token
    let resetToken=crypto.randomBytes(32).toString("hex")+ user._id;
    console.log("======>",resetToken);

    //hashtoken before saving in db
    const hashedToken=crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    console.log("++++++++>",hashedToken);
    //save token in db
    await new Token({
        userId:user._id,
        token:hashedToken,
        createdAt:Date.now(),
        expiresAt:Date.now()+30*(60*1000), //30 mnt
    }).save();

    //constract reset url
    const resetUrl=`${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    //reset email
    const message=`
    <h2>Hello ${user.name}</h2>
    <p>Please use the url bellow to reset your password</p>
    <p>This reset link is valid for only 30minutes.</p>
    <a href=${resetUrl} clicktracking="off">${resetUrl}</a>
     <p>Regards...</p>
     <p>Pinvent Team</p>`;
    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
        await sendEmail(subject, message, send_to, sent_from);
        res.status(200).json({ success: true, message: "Reset Email Sent again" });
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again");
    }
});

//reset password
const resetPassword=asyncHandler(async(req,res)=>{
    const {password}=req.body;
    const {resetToken}=req.params;

    //hash token,then compare token in db token
    const hashedToken=crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")
    //find token in db
    const userToken= await Token.findOne({
        token:hashedToken,
        expiresAt:{ $gt:Date.now()},
    });
    if(!userToken){
        res.status(400);
        throw new Error("Invalid or expired token");
    }
    //find user
    const user=await User.findOne({_id:userToken.userId});
    user.password=password;
    await user.save();
    res.status(200).json({message:"password reset successfully"});

});

module.exports={registerUser,loginUser,logoutUser,getUser,loginStatus,updateUser,changePassword,forgotPassword,resetPassword};