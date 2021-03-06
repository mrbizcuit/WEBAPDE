const express = require("express")
const router = express.Router()
const app = express()

const bodyparser = require("body-parser");
const crypto = require("crypto")
const fs = require("fs");
const cookieparser = require("cookie-parser")
const multer = require("multer");
const path = require("path");
//makes forms readabel as request.body/request.query
const urlencoder = bodyparser.urlencoded({
    extended: false
});

const Meme = require("../model/meme.js");
const User = require("../model/user.js");
const Tag = require("../model/tag.js");

const UPLOAD_PATH = path.resolve(__dirname, "../Memes")
const upload = multer({
    dest: UPLOAD_PATH,
    limits: {
        fileSize: 10000000,
        files: 2
    }
})

router.use(cookieparser())

router.post("/uploadMeme", upload.single("meme"), urlencoder, (req, resp) => {
    console.log("POST meme/upload")

    var title = req.body.title
    var owner = req.body.owner
    var desc = req.body.desc
    if (req.body.status == "on") {
        var status = "Public"
    } else {
        var status = "Private"
    }
    var image = req.file.filename
    var shared = req.body.shared.split(",")
    var tags = req.body.tags.split(",")
    var owner = req.cookies.username
    var meme = {
        title,
        owner,
        description: desc,
        image,
        status,
        shared,
        tags
    }

    Meme.addNewMeme(meme).then((newMeme) => {
        console.log("Added Meme to database")
        console.log(newMeme)
        
        for(let x = 0; x<tags.length; x++)
            Tag.getTag(tags[x]).then((suc)=>{
                if(suc){ //tag exists already
                    Tag.addMeme(suc.name, newMeme).then((succ)=>{
                        console.log("Added Meme to Tag Successful")
                    }, (er)=>{
                        console.log("Error in Tag")
                    })
                } else { //makes a new tag with the meme
                    var memes = [newMeme]
                    var tag = {
                        name: tags[x],
                        memes
                    }
                    Tag.addTag(tag).then((succc)=>{
                        console.log("Created a new Tag Successfully")
                    }, (errr)=>{
                        console.log("ERROR: " + errr)
                    })
                }
                
            }, (err)=>{
                console.log("Error: " + err)
            })
        
        User.addPost(owner, newMeme).then(() => {
            console.log("added meme")
            for (var i = 0; i < shared.length; i++) {
                console.log(shared)
                console.log(shared[i])
                User.updateShared(shared[i], newMeme).then(() => {
                    console.log("added meme to user")
                }, (err) => {
                    console.log("Adding to shared: " + err)
                })
            }
            resp.redirect("/")
        }, (err) => {
            console.log("Adding to user failed: " + err)
        })
    }, (err) => {
        console.log("Adding Fail: " + err)
    })
})

router.post("/addShare", urlencoder, (req,resp)=>{
    console.log("POST /meme/addShare")
    var memeID = req.body.memeId
    var share = req.body.newShare.split(",")
    var newMeme
    
    Meme.findSpecific(memeID).then((foundMeme)=>{
        newMeme = foundMeme
        console.log(JSON.stringify(share))
        newMeme.shared = newMeme.shared.concat(share)
        console.log("New Meme is " + JSON.stringify(newMeme))
        Meme.updateOne(memeID, newMeme).then((succ)=>{
            console.log("Update Successful: " + succ)
            resp.send(newMeme)
        }, (err)=>{
            console.log("ERROR: " + err)
        })
    }, (err)=>{
        console.log("Error why")
    })
})

router.post("/editDesc", urlencoder, (req,resp)=>{
    console.log("POST /meme/editDesc")
    var memeId = req.body.memeId
    var desc = req.body.newDesc
    
    var newMeme
    
    Meme.findSpecific(memeId).then((foundMeme)=>{
        newMeme = foundMeme
        newMeme.description = desc
        console.log(newMeme.description)
        Meme.updateOne(memeId, newMeme).then((succ)=>{
            console.log("Update Successful: " + succ)
            resp.send(newMeme)
        }, (err)=>{
            console.log("ERROR: " + err)
        })
    })
    console.log(memeId)
})

router.post("/addTags", urlencoder, (req,resp)=>{
    console.log("POST /meme/addTags")
    var memeID = req.body.memeId
    var newTags = req.body.newTags.split(",")
    
    var newMeme
    
    Meme.findSpecific(memeID).then((foundMeme)=>{
        newMeme = foundMeme
        console.log(JSON.stringify(newTags))
        newMeme.tags = newMeme.tags.concat(newTags)
        
        for(let x = 0; x<newTags.length; x++)
            Tag.getTag(newTags[x]).then((suc)=>{
                if(suc){ //tag exists already
                    Tag.addMeme(suc.name, newMeme).then((succ)=>{
                        console.log("Added Meme to Tag Successful")
                    }, (er)=>{
                        console.log("Error in Tag")
                    })
                } else { //makes a new tag with the meme
                    var memes = [newMeme]
                    var tag = {
                        name: newTags[x],
                        memes
                    }
                    Tag.addTag(tag).then((succc)=>{
                        console.log("Created a new Tag Successfully")
                    }, (errr)=>{
                        console.log("ERROR: " + errr)
                    })
                }
                
            }, (err)=>{
                console.log("Error: " + err)
            })
        console.log("New Meme is " + JSON.stringify(newMeme))
        Meme.updateOne(memeID, newMeme).then((succ)=>{
            console.log("Update Successful: " + succ)
            resp.send(newMeme)
        }, (err)=>{
            console.log("ERROR: " + err)
        })
    }, (err)=>{
        console.log("Error why")
    })
    console.log(req.body.memeId)
    console.log(req.body.newTags)

})

router.post("/removeTag", urlencoder, (req, resp)=>{
    var memeID = req.body.memeId
    var remove = req.body.removeTag
    
    console.log(memeID)
    console.log(remove)
    
    var newMeme
    
    Meme.findSpecific(memeID).then((foundMeme)=>{
        newMeme = foundMeme
        newMeme.tags = foundMeme.tags.filter((e) => e != remove)
        console.log(JSON.stringify(newMeme.tags))
        Tag.getAllNames().then((names)=>{
        for(let x = 0; x<names.length; x++)
            Tag.removeMeme(names[x].name, memeID).then((succ)=>{
                console.log("Delete MemeTag Sammie")
            }, (err)=>{
                console.log("Delete MemeTag Nea: " + err)
            })
        })
        Meme.updateOne(memeID, newMeme).then((succ)=>{
            console.log("Update Successful: " + succ)
            resp.send(newMeme)
        }, (err)=>{
            console.log("ERROR: " + err)
        })
    })
})

router.post("/removeShare", urlencoder, (req, resp)=>{
    var memeID = req.body.memeId
    var remove = req.body.removeShare
    
    console.log(memeID)
    console.log(remove)
    
    var newMeme
    
    Meme.findSpecific(memeID).then((foundMeme)=>{
        newMeme = foundMeme
        newMeme.shared = foundMeme.shared.filter((e) => e != remove)
        console.log(JSON.stringify(newMeme.tags))
        User.findShared(memeID).then((sharedusers)=>{
            for(let x = 0; x<sharedusers.length; x++)
                User.removeShared(sharedusers[x].username, memeID).then((succ)=>{
                    console.log("Delete MemeShared Sammie")
                }, (err)=>{
                    console.log("Delete MemeShared Nea: " + err)
                })
        }, (err)=>{
            console.log("Nea error " + err)
        })
        Meme.updateOne(memeID, newMeme).then((succ)=>{
            console.log("Update Successful: " + succ)
            resp.send(newMeme)
        }, (err)=>{
            console.log("ERROR: " + err)
        })
    })
})

router.post("/getMeme", urlencoder, (req, resp) => {
    console.log("POST /meme/getMeme")
    var memeId = req.body.memeid

    Meme.findSpecific(memeId).then((newdoc) => {
        resp.send(newdoc)
    }, (err) => {

    })
})
// this should be in controller post
router.get("/photo/:id", (req, res) => {
    console.log("called picture")
    console.log(req.params.id)

    fs.createReadStream(path.resolve(UPLOAD_PATH, req.params.id)).pipe(res)

})

// if passing the img rather than the post id
// change doc.filename to req.params.id
router.post("/delete", urlencoder, (req, resp) => {
    var memeId = req.body.memeId
    
    Meme.deleteMe(memeId).then((succ)=>{
        console.log("Delete Meme Sammie")
    }, (err)=>{
        console.log("Delete Meme Nea: " + err)
    })
    
    Tag.getAllNames().then((names)=>{
        for(let x = 0; x<names.length; x++)
            Tag.removeMeme(names[x].name, memeId).then((succ)=>{
                console.log("Delete MemeTag Sammie")
            }, (err)=>{
                console.log("Delete MemeTag Nea: " + err)
            })
    })
    User.findShared(memeId).then((sharedusers)=>{
        
        for(let x = 0; x<sharedusers.length; x++)
            User.removeShared(sharedusers[x].username, memeId).then((succ)=>{
                console.log("Delete MemeShared Sammie")
            }, (err)=>{
                console.log("Delete MemeShared Nea: " + err)
            })
    }, (err)=>{
        console.log("Nea error " + err)
    })
    User.findOwner(memeId).then((owner)=>{
        User.removePost(owner.username, memeId).then((succ)=>{
            console.log("Delete MemeShared Fuck Me")
            resp.send(memeId)
        }, (err)=>{
            console.log("Delete MemeShared Nea: " + err)
        })
    }, (err)=>{
        console.log("Nea error " + err)
    })
})

// always remember to export the router for index.js
module.exports = router
