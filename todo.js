const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const Joi = require('joi');

const db = require("./db");
const collection = "todo";
const app = express();

// schema used for data validation for our todo document
const schema = Joi.object().keys({
    todo : Joi.string().required()
});

// parses data
app.use(bodyParser.json());

// sends static html file to user
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'));
});

// read
app.get('/getTodos',(req,res)=>{
    db.getDB().collection(collection).find({}).toArray((err,documents)=>{
        if(err)
            console.log(err);
        else{
            res.json(documents);
        }
    });
});

// update
app.put('/:id',(req,res)=>{
    const todoID = req.params.id;
    const userInput = req.body;
    db.getDB().collection(collection).findOneAndUpdate({_id : db.getPrimaryKey(todoID)},{$set : {todo : userInput.todo}},{returnOriginal : false},(err,result)=>{
        if(err)
            console.log(err);
        else{
            res.json(result);
        }      
    });
});


//create
app.post('/',(req,res,next)=>{
    // Document to be inserted
    const userInput = req.body;

    //document validation
    Joi.validate(userInput,schema,(err,result)=>{
        if(err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection(collection).insertOne(userInput,(err,result)=>{
                if(err){
                    const error = new Error("Failed to insert Todo Document");
                    error.status = 400;
                    next(error);
                }
                else
                    res.json({result : result, document : result.ops[0],msg : "Task Is Added Successfully!!!",error : null});
            });
        }
    })    
});



//delete
app.delete('/:id',(req,res)=>{
    const todoID = req.params.id;
    db.getDB().collection(collection).findOneAndDelete({_id : db.getPrimaryKey(todoID)},(err,result)=>{
        if(err)
            console.log(err);
        else
            res.json(result);
    });
});

// Middleware for handling Error
app.use((err,req,res,next)=>{
    res.status(err.status).json({
        error : {
            message : err.message
        }
    });
})


db.connect((err)=>{
    if(err){
        console.log('unable to connect to database');
        process.exit(1);
    }
    // Successful connection
    else{
        app.listen(3000,()=>{
            console.log('connected to database, app listening on port 3000');
        });
    }
});