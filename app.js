//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport"); 
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

secret = process.env.SECRET; //Saved in .env


//setup session
app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false
}));

//initialize passport package and use passport for dealing with session
app.use(passport.initialize()); //sets up passport for authentication
app.use(passport.session()); 

const MONGODB_URL = process.env.MONGO_URL;

mongoose.connect(MONGODB_URL, {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const factSchema = new mongoose.Schema({
    fact: String,
    facttitle: String, 
    proof: String
});

userSchema.plugin(passportLocalMongoose); //for salting, hashing and saving users in DB with passportLocalMongoose


const User = new mongoose.model("User", userSchema);
const Fact = new mongoose.model("Fact", factSchema);

//serialize and deserialize using npm passport-local-mongoose ... saves a lot of time and code, better 

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/logout", function(req,res){
    req.logout(); //logout with passport.js
    res.redirect("/"); //redirect to home page
})

app.get("/about", function(req,res){
    res.render("about");
})

app.get("/FactSmash", function(req, res){ //checks again after register/login if user is authenticated!
    //check if user is authenticated
    /*if(req.isAuthenticated()){
        res.render("FactSmash");
    }
    else{
        res.redirect("/login"); //if user is not authenticated, redirect to login!
    } */



    Fact.find({"fact": {$ne: null}}, function(err, foundFacts){ //finds all facts that are not null in DB
        if(err){
            console.log(err);
        }
        else{
            if(foundFacts){
                res.render("FactSmash", {factsicles: foundFacts});
            }
        }
    }); 



});

//Post to DB 
app.post("/register", function(req, res){
    //pasportLocalMongoose register:
    User.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/register");
            } else{
                passport.authenticate("local")(req,res, function(){  //last function is only called if authentication succeeded
                    res.redirect("/FactSmash"); //if he is still logged in and goes to /FactsSmash he will still be able to view it ...if session is still active
                })
            }
    
    });
});


app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/FactSmash");
            })
        }
    })
});

app.post("/submit", function(req,res){
    const submittedFact = req.body.fact;
    const submittedTitle = req.body.title;
    const submittedProof = req.body.proof;

    var factObj = {
        fact: submittedFact,
        facttitle: submittedTitle,
        proof: submittedProof
    }
    
    Fact.collection.insertOne(factObj, function(err, docs){
        if(err){
            return console.log(err);
        }
        else {
            console.log("Saved!");
        }
    })

    res.redirect("/FactSmash");
    
    /*
    Fact.fact = submittedFact;
    Fact.facttitle = submittedTitle;
    Fact.proof = submittedProof;
    Fact.save(function(){
        res.redirect("/FactSmash");
    }); 
    */
   
});

app.listen(3000, function(){
    console.log("Server is running on port 3000.")
})