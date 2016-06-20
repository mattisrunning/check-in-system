var express             = require('express'),
    router              = express.Router();
var mongoose =  require('mongoose');
var users =     require('../model/usersModel');
var User = mongoose.model('user', users);
var path = require('path');
var config = require('../../config');
var jwt = require('jsonwebtoken');


router.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    config.token = token;

   if(req.originalUrl == '/admins/login' || req.originalUrl == 'users/checkin'){
        next();
   }else {

       // decode token
        if (token) {
           // verifies secret and checks exp
           jwt.verify(token, config.secret, function (err, decoded) {
               if (err) {
                   return res.json({success: false, message: 'Failed to authenticate token.'});
               } else {
                   // if everything is good, save to request for use in other routes
                   req.decoded = decoded;
                   next();
               }
           });
       } else {
           // if there is no token
           // return an error
           console.log("Error");
       }
   }

});


router.post('/login', function(req,res){
    console.log(req.body);
    User.findOne({
            student_id:req.body.adminID,
            password:req.body.adminPass,
            isAdmin : true
        }
    ,function(err,results){
        if(err){
            console.log("err: "+err);
        }
        if(results){
            //if found go to adminviewpage.html

            var temp_tok = jwt.sign({student_id : req.body.adminID, password : req.body.adminPass}, config.secret, {
                expiresIn: 3600
            });
            token = temp_tok;
            res.status(200);
            res.json({
                status : 200,
                message : "Found",
                token : temp_tok
            });
        }else{
            //if not found then give warning, an alert or something
            res.status(201);
            res.json({
                status: 201, //error
                error: "User Not Found"
            });
        }
    });
});

//allow admins to add user
router.post('/addUser', function(req, res) {
    /* create new user Schema with the req */
    var newUser = new User(req.body);
    /* Save data from user input into the database */
    newUser.save(function(err) {
        if (err) {
            res.status(201);
            res.json(
                {
                    status: 201,
                    error:  'Unable to add user. Error:' +err.message
                }
            );
        } else {
            res.status(200);
            res.json(
                {
                  message: "Successfully Added User"
                }
            );
        }
    });
});

//allow admins to edit user
router.post('/editUser', function(req, res) {

    User.update({
            "_id": req.body.id
        },
        {
            $set:{
                "name": req.body.new_name,
                "student_id": req.body.new_student_id,
                "email": req.body.new_email,
                "isAdmin": req.body.promoteAdmin,
                "password": req.body.new_password
            }
        },
        function (err, result) {
            if (err) {
                res.status(201);
                res.json({
                    status: 201,
                    message: "Unable to edit user",
                    error: err
                });
            }
            else{
                res.status(200);
                res.json({
                    status: 200
                })
            }
        });

});

//allow admins to edit History (checkIn/checkOut times)
router.post('/editTimeInHistory', function(req, res) {

    var checkinUpdate = "time."+req.body.update_index+".checkin";
    var checkoutUpdate = "time."+req.body.update_index+".checkout";
    var updateQuery = {};

    updateQuery[checkinUpdate] = req.body.new_checkIn;
    updateQuery[checkoutUpdate] = req.body.new_checkOut;

    User.update({
            "_id": req.body.id
        },
        {
            $set: updateQuery
        },
        function (err, result) {
            if (err) {
                res.status(201);
                res.json({
                    status: 201,
                    message: "Unable to edit user",
                    error: err
                });
            }
            else{
                res.status(200);
                res.json({
                    status: 200
                })
            }
        });
});

//allow admin to view all of the Users
router.get('/viewUsers', function(req, res) {
    User.find({}, function (err, results) {
        if (err) {
            res.send('Unable to view users. Error:' + err.message);
        } else {
            res.status(200);
            res.json(results);
        }
    });
});


//allows admin to delete Users
router.post('/deleteUsers', function(req, res) {
    User.findByIdAndRemove(req.body._id, function(err){
        if(err){
            res.status(202);
            res.json({
                status : 202
            });
        }
        else{
            res.status(200);
            res.json({
                status : 200
            });
        }
    })
});

module.exports = router;