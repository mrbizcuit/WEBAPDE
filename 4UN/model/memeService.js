const mongoose = require("mongoose");
var Meme = require("mongoose").model("Meme")
var MemeSchema = Meme.schema

function getAll(){
    var Memes = Meme.find().then((memes)=>{
        return memes
    },(err)=>{
        return false  
    });
}

