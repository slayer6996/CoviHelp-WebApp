const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/resourcesDB", {useNewUrlParser:true, useUnifiedTopology:true})

const app = express()

app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended:true}))


const detailsScehma = new mongoose.Schema({
    name: {type: String, required: true},
    resource: {type: String, required: true},
    city:{type: String, required: true},
    contact:{type: Number, required: true}
})

const Detail = new mongoose.model("Detail", detailsScehma)

app.get("/", function(req,res){
    Detail.find({}, function(err, foundDetails){
        if(err){
            console.log(err)
        }else{
            res.render("details", {foundDetails:foundDetails})
        }
    })
})

app.post("/searchResource",function(req,res){
    const requestedCity = req.body.city
    Detail.find({city:requestedCity}, function(err, foundDetails){
        if(err){
            console.log(err)
        } else{
            res.render("details", {foundDetails:foundDetails})
        }
    })
})

app.get("/postResources", function(req,res){
    res.render("post")
})

app.post("/postResources", function(req,res){
    const post = new Detail({
        name:req.body.name,
        resource: req.body.resource,
        city:req.body.city,
        contact: req.body.contact
    })
    post.save()
    res.redirect("/")
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
    console.log("server running on port 3000")
})