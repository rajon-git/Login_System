const errorHandler=(err,req,res,next)=>{
    const statCode=res.statusCode ? res.statusCode:500;
    res.status(statCode)
    res.json({
        message:err.message,
        stack:process.env.NODE_ENV ==="development" ? err.stack:null,
    });
}
module.exports=errorHandler;