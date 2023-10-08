const express = require("express")
const mongoose = require ('mongoose')
const cors = require("cors")
const EmployeeModel = require('./models/Employee')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const UserModel =require('./models/User')
const nodemailer = require("nodemailer");
require('dotenv').config();

const app = express()
app.use(express.json())
app.use (cors({
    origin: ["http://localhost:5173"],
    methods:["GET","POST"],
    credentials:true
}))
app.use(cookieParser())

mongoose.connect(process.env.MONGODB_URI);

const verifyUser = (req,res, next) =>{
    const token = req.cookies.token;
    if(!token) {
        return res.json("The token was mot available")
    } else{
        jwt.verify(token,process.env.jwt, (err,decoded) =>{
            if(err) return res.json("Token is wrong")
            next();


        })
    }
    
}

app.get('/home',verifyUser,(req,res) => {
    return res.json("sucess")
})

app.post("/login", (req,res) =>{
    const {email, password } = req.body;
    UserModel.findOne({email:email})
    .then(user => {
        if(user) {
            bcrypt.compare (password,user.password, (err, response) => {
                if(err){
                     res.json("the password is incorrect")
                }
                if (response){
                    const token = jwt.sign({email:user.email}, 'process.env.jwt',{expiresIn:"1d"})
                    res.cookie("token", token);
                    res.json("success")
                }else {
                    res.json("the password is incorrect")
                }
            })
        }else {
            res.json ('No record existed')
        }
    })
})


app.post('/register', (req, res) => {
    const {name,email,password} = req.body;
    bcrypt.hash(password,10)
    .then(hash=>{
        UserModel.create({name,email,password:hash})
        .then(employees => res.json(employees))
        .catch(err => res.json(err))
    
    }).catch(err => console.log(err.message))
})

app.post('/forgot-password', (req, res) => {
    const {email} = req.body;
    UserModel.findOne({email: email})
    .then(user => {
        if(!user) {
            return res.send({Status: "User not existed"})
            
        } 
        const token = jwt.sign({id: user._id}, process.env.jwt, {expiresIn: "1d"})
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'johnkennady2201@gmail.com',
              pass: 'irdc fcqs fdil syoe'
            }
          });
          
          var mailOptions = {
            from: 'johnkennady2201@gmail.com',
            to: user.email,
            subject: 'Reset Password Link',
            text: `http://localhost:5173/reset_password/${user._id}/${token}`
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              return res.send({Status: "Success"})
            }
          });
    })
})
app.post('/reset-password/:id/:token', (req, res) => {
    const {id, token} = req.params
    const {password} = req.body

    jwt.verify(token, process.env.jwt, (err, decoded) => {
        if(err) {
            return res.json({Status: "Error with token"})
        } else {
            bcrypt.hash(password, 10)
            .then(hash => {
                UserModel.findByIdAndUpdate({_id: id}, {password: hash})
                .then(u => res.send({Status: "Success"}))
                .catch(err => res.send({Status: err}))
            })
            .catch(err => res.send({Status: err}))
        }
    })
})
app.listen(3001,() =>{
    console.log("server is running")
})