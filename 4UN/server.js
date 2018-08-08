const bodyparser = require("body-parser");
const crypto = require("crypto")
const express = require("express");
const mongoose = require("mongoose");
const hbs = require("hbs");
const fs = require("fs");
const cookieparser = require("cookie-parser")
const multer = require("multer");
const path = require("path");

const MemeModel = require("./model/meme.js");
const UserModel = require("./model/user.js");
const TagModel = require("./model/tag.js");

const Meme = require("./model/memeService.js");
const User = require("./model/userService.js");
const Tag = require("./model/tagService.js");

//app creates server
const app = express();
//makes forms readabel as request.body/request.query
const urlencoder = bodyparser.urlencoded({extended : false});
//sets view engine to handlebars
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public.Memes"));
app.set("view-engine", "hbs");
app.use(cookieparser())

const upload = multer({
  dest: "/public/Memes"
});

// connecting to our mongodb server
//Promise Library
mongoose.Promise = global.Promise;

//connect to the database
mongoose.connect("mongodb://localhost:27017/memedata", {
    useNewUrlParser: true 
});

/**************************************************************************************/

app.get("/", (req, resp)=>{
    console.log("GET /");
    var userpic = req.cookies.userpicture
    
    var query = User.getAll()
    query.exec(function(err, users){
        if(err){
            
        }
            //error
        else{
            console.log(users)
        }
    })
    
    if (userpic) {
        resp.render("index.hbs", {
            user: {
                profilepic: userpic
            },
            col1: [
//            {
//            title: "lololol",
//            author: "bacon",
//            source: "https://scontent.fmnl10-1.fna.fbcdn.net/v/t1.0-9/23518934_146331502660485_6251669915140632690_n.jpg?_nc_cat=0&oh=e2928920827b2d448baa598f14ff8eb0&oe=5BCD344A",
//            desc: "lololololololololol",
//            tags: ["girl","twice"]
//            }
        ],
            col2: [],
            col3: []
        })
    } else {
        resp.render("index.hbs", {
            col1: [
    //            {
    //            title: "lololol",
    //            author: "bacon",
    //            source: "https://scontent.fmnl10-1.fna.fbcdn.net/v/t1.0-9/23518934_146331502660485_6251669915140632690_n.jpg?_nc_cat=0&oh=e2928920827b2d448baa598f14ff8eb0&oe=5BCD344A",
    //            desc: "lololololololololol",
    //            tags: ["girl","twice"]
    //            }
            ],
            col2: [],
            col3: []
        })
    }
});

app.get("/search", urlencoder, (req,resp)=>{
    console.log("GET /tags")
    
    var tag = req.query.searchinput
    console.log("Tag: " + tag)
    
    var userpic = req.cookies.userpicture
    if (userpic) {
        resp.render("tags.hbs", {
            tag,
            user: {
                profilepic: userpic
            }
        })
    } else {
        resp.render("tags.hbs", {
            tag
        })
    }

})

app.get("/userPage", (req, resp)=>{
    console.log("GET /user")
    
    var userpic = req.cookies.userpicture
    if (userpic) {
        resp.render("user.hbs", {
            user: {
                profilepic: userpic
            }
        })
    } else {
        resp.render("user.hbs", {
        })
    }
})

app.get("/loginPage", (req, resp)=>{
    console.log("GET /login")
    resp.render("login.hbs")
})

app.post("/login", urlencoder, (req,resp)=>{
    console.log("POST /login")
    
    var username = req.body.uname 
    var password = req.body.pword 
    var user = {
        profilepic: "https://scontent.fmnl10-1.fna.fbcdn.net/v/t1.0-9/23518934_146331502660485_6251669915140632690_n.jpg?_nc_cat=0&oh=e2928920827b2d448baa598f14ff8eb0&oe=5BCD344A"
    }
    //put user check here
    if(username == "admin" && password == "1234"){
        console.log("SUCCESS")
         resp.cookie("userpicture", user.profilepic, {
            maxAge: 1000 * 60 * 60 * 2
        })

        resp.render("index.hbs", {
            user
        })
    } else {
        console.log(username + " " + password)
        resp.render("login.hbs", {
            message: "Invalid username or password"
        })
    }
    
})

app.get("/signupPage", (req,resp)=>{
    console.log("GET /signup")
    resp.render("signup.hbs")
})

app.post("/signup",upload.single("body.ppic"), urlencoder, (req, resp)=>{
    console.log("POST /signup")
    
    
    var username = req.body.uname 
    var email = req.body.email
    var unhashedpassword = req.body.pword 
    var desc = req.body.sdesc 
    //var profile = req.ppic.path
    //console.log(profile)
    var password = crypto.createHash("md5").update(unhashedpassword).digest("hex")
    
    //if you can make the profile a proper picture, it would be greatly appreciated
    
    var user = new UserModel({
        username,
        password,
        desc,
        profilepicture: "LOLOLOLOLOL",
        posts: [],
        shared: []
    })
    
    user.save().then((newdoc) => {
        //successful 
//        response.render("index.hbs", {
//            message: "Ticket was added successfully"
//        })
        console.log("Successful")
    }, (err) => {
//        response.render("index.hbs", {
//            message: "Ticket was not added" + err
//        })
        console.log("Not")
    })
})

//app.post("/registered", urlencoder, (req, resp)=>{
//    //when they send their info
//})

app.get("/signout", urlencoder, (req, resp)=>{
    resp.clearCookie("userpicture")
    resp.render("index.hbs")
})

app.listen(3000,()=>{
    console.log("Listening to port 3000")
});