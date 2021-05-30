const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/resourcesDB", {useNewUrlParser:true, useUnifiedTopology:true})
const bcrypt=require("bcrypt")
const saltRounds = 10;

const app = express()

app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended:true}))

//All the resources visible to users will be from this collection 

const detailsScehma = new mongoose.Schema({
    name: {type: String, required: true},
    resource: {type: String, required: true},
    city:{type: String, required: true},
    contact:{type: Number, required: true}
})

const Detail = new mongoose.model("Detail", detailsScehma)

//details posted by others user yet to be confirmed will be saved in this collection 

const pendingDetailsSchema = new mongoose.Schema({
    name: {type: String, required: true},
    resource: {type: String, required: true},
    city:{type: String, required: true},
    contact:{type: Number, required: true}
})

const pendingDetail = new mongoose.model("pendingDetail", pendingDetailsSchema)

//details of admin who will be having access to the pending details as well as confirmed details
const adminSchema = new mongoose.Schema({
    username: String,
    password: String
})

const Admin = new mongoose.model("Admin", adminSchema)

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
    res.render("posts")
})

app.post("/postResources", function(req,res){
    //details posted by user wil wait for verification from admin
    const post = new pendingDetail({
        name:req.body.name,
        resource: req.body.resource,
        city:req.body.city,
        contact: req.body.contact
    })
    post.save()
    res.redirect("/")
})

//load the admin login page
app.get("/adminLogin", function(req,res){
    res.render("login")
})

//login for admin
app.post("/adminLogin", function(req,res){
    const username=req.body.username
    const password=req.body.password
    // Load hash from your password DB.
    bcrypt.compare(password, hash, function(err, result) {
        if(err){
            console.log(err)
        } else if(result == true){
            res.redirect("/adminPage")
        } else if(result == false){
            res.redirect("/login")
        }
    });
})

//this page will be visible to the admin from where verified and pending posts can be viewed.
app.get("/adminPage", function(req,res){
    res.render("adminPage")
})

app.get("/viewVerifiedDetails", function(req,res){
    Detail.find({}, function(err, foundDetails){
        if(err){
            console.log(err)
        }else{
            res.render("verifiedDetails", {foundDetails:foundDetails})
        }
    })
})

app.get("/viewPendingDetails", function(req,res){
    pendingDetail.find({}, function(err, foundDetails){
        if(err){
            console.log(err)
        }else{
            res.render("pendingDetails", {foundDetails:foundDetails})
        }
    })
})

//this option on the adminpage will render all the verified details along with delete option
app.post("/verifiedDetails",function(req,res){
    const requestedCity=req.body.city;

    Detail.find({city:requestedCity}, function(err, foundDetails){
        if(err){
            console.log(err)
        }else{
            res.render("verifiedDetails", {foundDetails:foundDetails})
        }
    })
})

//when the admin attempts to delete any of the verified details from the DB
app.post("/deleteDetails", function(req,res){
    const deletedDetailsId=req.body.id;
    console.log(deletedDetailsId)
    Detail.deleteOne({_id:deletedDetailsId}, function(err){
        if(err){
            console.log(err)
        } else{
            //after successful deletion the list of verified details will appear again 
            res.redirect("/viewVerifiedDetails")
        }
    })
})

//this will enable the admin to view all the pending details
app.post("/pendingDetails", function(req,res){
    pendingDetail.find({}, function(err, foundDetails){
        if(err){
            console.log(err)
        }else{
            res.render("pendingDetails", {foundDetails:foundDetails})
        }
    })
})

//when admin deletes one of the pending details
app.post("/deletePendingDetails", function(req,res){
    const deletedDetailsId=req.body.id;
    pendingDetail.deleteOne({_id:deletedDetailsId}, function(err){
        if(err){
            console.log(err)
        } else{
            //after successful deletion the list of pending details will appear again 
            res.redirect("/pendingDetails")
        }
    })
})

//when admin verifies one of the pending details, it needs to move to the verified details DB 
app.post("/verification", function(req,res){
    //get the id of verified detail
    const verifiedDetailId=req.body.id
    //search for the detail in the DB
    pendingDetail.find({_id:verifiedDetailId}, function(err, foundDetails){
        if(err){
            console.log(err)
        }else{
            //save the found details as verified details 
            const verifiedDetail = new Detail({
                name: foundDetails.name ,
                resource: foundDetails.resource ,
                city:foundDetails.city,
                contact: foundDetails.contact
            })
            console.log("saving this into verified details directory")
            verifiedDetail.save()
        }
            //after successfully moving selected details to verified details DB , delete it from pending details DB
            pendingDetail.deleteOne({_id:verifiedDetailId}, function(err){
                if(err){
                    console.log(err)
                } else{
                    res.redirect("/viewPendingDetails")
                }
            })
    })
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
    console.log("server running on port 3000")
})