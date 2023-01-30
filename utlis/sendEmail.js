const nodeMailer=require("nodemailer");

const sendEmail=async (subject,message,send_to,sent_from,reply_to)=>{
    //create email transorter
    const transporter=nodeMailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:587,
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    //option for sending mail
    const options={
        from:sent_from,
        to:send_to,
        reply:reply_to,
        subject:subject,
        html:message,
    };
    //send email
    transporter.sendMail(options,function(err,info){
        if(err){
            console.log(err);
        }else{
            console.log(info);
        }
    });
}
module.exports=sendEmail;