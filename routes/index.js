var express = require('express');
var router = express.Router();
var session = require("express-session");
var promise=require('promise');
var fs=require("fs");
var path=require("path");
var bodyparser=require("body-parser");
var crypto=require("crypto");
var formidable = require('formidable');

router.use(session({
    secret: 'yicauthprivate',
    cookie:{maxAge:60*60*24*1000},
    resave: false,
    saveUninitialized: false
}));
var io=require('../bin/www');

//var _db=require('./mongo');
var multer=require("multer");
router.use(bodyparser.urlencoded({extended:false}));
var id=require('idgen');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var  m=require('mongodb');

var url="mongodb://yic:alwaysforward1.@ds040837.mlab.com:40837/yic"; //keep it safe

var mc=m.MongoClient;
var _db;


mc.connect(url,function(err,db){
    if(err)
    {
        console.log(err);
    }
    else
    {
        console.log("DB connected");
        _db=db;
    }
});







function send_invite(email,url)                                     //sending email invite
{
    var transporter = nodemailer.createTransport(smtpTransport({
        service: 'Gmail',
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
            user: 'yic.jci3.1@gmail.com',
            pass: 'alwaysforward1.'
        }
    }));
    var link="http://yic3.herokuapp.com/signup_autho?email="+email+"&id="+url;
    transporter.sendMail({
        from: "yic.jci3.1@gmail.com",
        subject:"Invitation for YIC" ,
        to: email,
        html : "<!DOCTYPE HTML>\n" +
        "<html>\n" +
        "    <head>\n" +
        "    </head>\n" +
        "    <body style=\"padding:5px;margin:1px;\">\n" +
        "        <div style=\"background-color: aliceblue;\">\n" +
        "        <div style=\"background-color: aliceblue;width:98%;height:100%;padding:10px\">\n" +
        "            <center>\n" +
        "                <img src=\"http://yic3.herokuapp.com/assets/images/logo-yic.png\" style=\"width:70px;height:40px\"/>\n" +
        "                <p><strong>Young Innovators Club</strong></p>\n" +
        "            </center>\n" +
        "        </div>\n" +
        "        <div style=\"background-color:aliceblue;font-family: 'Open Sans', sans-serif;\">\n" +
        "            <p style=\"margin-left:2%\">Dear Invitee,</p>\n" +
        "            <p style=\"margin-left:5%;margin-right:5%\">Young Innovators Club (YIC) are pleased to invite you to join our club as a member. With YIC membership you would get access to all the projects and initiatives currently in progress at YIC. Additionally, registering yourself with YIC will enable you to further gain access to discuss with mentors and receive their guidance and also allow you to post blogs and forum replies.</p>\n" +
        "        </div>\n" +
        "        <div style=\"background-color:aliceblue;width:98%;height:100%;padding:10px\">\n" +
        "            <center><a href=\""+link+"\" style=\"font-family: 'PT Sans', sans-serif;display:inline-block;padding:10px 20px;background-color:deepskyblue;text-decoration: none;color:aliceblue\">Accept Invitation</a></center>\n" +
        "        </div>\n" +
        "        <div style=\"background-color:aliceblue;width:98%;height:100%;padding:10px;font-family: 'Open Sans Condensed', sans-serif;\">\n" +
        "            <center><p>That’s it – you’re all set! If you have any questions or concerns, reach out to the YIC Support Team by emailing yic.jci3.1@gmail.com </p></center>\n" +
        "        </div>\n" +
        "        </div>\n" +
        "    </body>\n" +
        "</html>"
    }, function(error, info) {
        if (error) {
            return console.log(error);
        }
        else {
            console.log('Message %s sent: %s', info.messageId, info.response);
            console.log("Mail sent successfully");

        }
    });




}

var invite1=function (req,res,userid,gid) {

    var data={
        _id:req.body.email,
        id:gid,
        name:req.body.name,
        role:req.body.role,
        up:"n",
        yic_id:userid
    };
    console.log(data);
    var h=_db.collection('email');
    h.insertOne(data,function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log("user invited:"+req.body.email+" id:"+gid);
            send_invite(req.body.email,gid);
        }
    });
};


var yic_id=function(req,res,gid)
{

    var count=0;
    var userid="";
    var collect= _db.collection("yic_details");
    collect.find({_id:"yic101"}).forEach(function(x) {
        JSON.stringify(x);
        count = x.yic_members;
        console.log("found:");
        console.log(count);
        var date = new Date();
        var year = date.getFullYear().toString();
        var digit = year.substring(2, 4);
        var nodigits = count.toString().length;


        count++;

        if (nodigits == 1) {
            console.log("yeeeeees");
            userid = digit + "YIC" + "000" + count;
            console.log(userid);
        }
        else if (nodigits === 2) {
            userid = digit + "YIC" + "00" + count;
        }
        else if (nodigits === 3) {
            userid = digit + "YIC" + "0" + count;
        }
        else {
            userid = digit + "YIC" + count;
        }



        var h=_db.collection("yic_details");
        h.updateOne({_id:"yic101"},{$set:{yic_members:count}});

        invite1(req,res,userid,gid);


    });






};

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'YIC' });
});

router.get('/users',function(req,res){
    res.render('users',{title:'YIC'});
});



router.post('/user_invite',function(req,res){
    //need to check the session
    //if(req.body.email!=="" && req.body.role!=="")   //need to check the persons role
    //{
    var gid = id(15);
    var h=_db.collection('email');

    var cursor=h.find({_id:req.body.email});

    cursor.count(function (err,c){
        if(err){
            console.log(err);
        }
        else
        {
            if(c===1)
            {
                console.log("user already invited");
                res.send("user already invited");
            }
            else
            {
                console.log("yes");
                yic_id(req,res,gid);

            }
        }
    });

    //}
    //else
    //{

    //}
});


router.get('/signup_autho',function(req,res){

    if(req.query.id!==undefined) {
        var h = _db.collection("email");
        var cursor=h.find({_id: req.query.email,id:req.query.id});
        cursor.count(function(err,c){
            if(err)
            {
                console.log(err)
            }
            else
            {
                if(c==1)
                {
                    var h=_db.collection("email");
                    h.find({_id:req.query.email}).forEach(function(x){
                        if(x.up==="n")
                        {
                            var ses=req.session
                            ses.user_valid="y";;
                            ses.user_id=req.query.id;
                            console.log("user visited "+req.query.email);
                            /*  var h=_db.collection("email");
                              var role="";
                              h.find({_id:req.query.email,id:req.query.id}).forEach(function(x){
                                  role=x.role;
                              });*/

                            //  res.redirect("/signup?id="+req.query.id);  //email="+req.query.email+"&role="+role);
                            res.render("signup",{id:req.query.id});

                        }
                        else
                        {
                            res.send("Invalid credential access :(");
                        }
                    })
                }
                else
                    res.send("Invalid credential access :(");
            }
        });
    }

});

router.get("/signup",function(req,res) {
    var ses=req.session;


    if(ses.user_valid==="y")
    {
        res.send("yes");
//res.render("signup");
    }
    else
    {
        res.send("Invalid signup");
    }


});


var fun=function (req,res,email,name,role,id,crypted) {


    var data={
        _id:id,
        email:email,
        name:name,
        role:role,
        password:crypted
    };

    var h=_db.collection("users");

    h.insertOne(data);

    h=_db.collection('email');
    h.updateOne({_id:email},{$set:{up:"y"}});
    var s=req.session;
    s.user_valid="n";

};


var s_user=function(req,res,user_id){

    var cipher = crypto.createCipher("aes-256-ctr","d6F3Efeq");
    var crypted = cipher.update(req.body.password,"utf8","hex");
    crypted += cipher.final("hex");
    console.log("ENCRYPTION PASSWORD:"+crypted);
    var h=_db.collection("email");
    var email,name,role,id;
    h.find({id:user_id}).forEach(function(x){
        JSON.stringify(x);
        email=x._id;
        name=x.name;
        role=x.role;
        id=x.yic_id;
        fun(req,res,email,name,role,id,crypted);
    });



};



router.post('/signup_user',function(req,res){
    var ses=req.session;
    if(ses.user_valid==="y")
    {

        s_user(req,res,ses.user_id);

        res.send("yes");

    }
    else
    {
        res.send("fail");
    }


});

router.post('/login',function(req,res)
{
    var collection2= _db.collection("users");
    collection2.find({"email":req.body.email}).forEach(function(x){
      var e=x.email;
      var p=x.password;
      if((e===req.body.email)&&(p===req.body.password))
      {
          //var dashses=req.session;
          //dashses.email=req.body.email;
          console.log("Login successfull");
          res.send("success");
          //res.redirect(307,'/home');
      }
      else
      {
          console.log("Login unsuccessfull");
          res.send("failed");
      }
    });
});

/*var getcount=function(req,collection)
{
    collection.find({"list" : "guestemails"}).forEach(function(x)
    {
        var cc=x.count;
        ++cc;
        setcount(req,collection,cc);
    });
}*/
/*var setcount=function(req,collection,cc)
{
    collection.updateOne({"list" : "guestemails"},{$set:{"count":cc}},function(err,ok)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log("count updated");
            pushemail(req,collection);
        }
    });
}*/
/*var pushemail=function(req,collection)
{
    collection.update({"list":"guestemails"},{$push:{"email":req.body.email}},function(err,k){
        if(err)
        {
            console.log("err");
        }
        else
        {
            console.log("email updated");
        }
    });
}*/
router.post('/profile_photo_email',function(req,res,next)
{
     var collection=_db.collection("images_id");
     var filename=id(8)+".jpg";
     collection.insertOne({"email":req.body.email,"filename":filename},function(err,ok)
    {
          if(err)
          {
              console.log(err);
              console.log("error occured when inserted");
          }
          else
          {
              console.log("success");
              res.send(filename);
          }
    });
});

router.post('/guest_login',function(req,res)     //GUEST LOGIN
{
var email=req.body.email;
console.log(email);
var h=_db.collection("guest_email");
var cursor=h.find({_id:email});

    cursor.count(function (err,c){
        if(err){
            console.log(err);
        }
        else
        {
            if(c===1)
            {
               h.find({_id:email}).forEach(function (doc) {
                  //console.log(doc.visits);
                     var visits=doc.visits;
                     visits++;
                     h.updateOne({_id:email},{$set:{visits:visits}});
               res.send("success");
               });
            }
            else
            {
                var data={
                  _id:email,
                    visits:1,
                    role:"guest"
                };

                h.insertOne(data);
                res.send("success");
            }
        }
    });




});



router.post('/profile_upload',function(req,res,next)       //PROFILE UPLOAD
{
    console.log("get");
    var form = new formidable.IncomingForm();
    form.multiples = false;
    form.uploadDir = path.join("./assets/images/profileimages/");
    form.on('file', function(field, file) {
        fs.rename(file.path, path.join(form.uploadDir,file.name), function(err)
        {
            console.log("succesfully  renamed");
        });
    });
    form.on('error', function(err) {
        console.log('An error has occured: \n' + err);
    });
    form.on('end', function() {
        res.end('success');
    });
    form.parse(req);

    /*var storage	=multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, __dirname+"/public/assets/images/profileimages/");
        },
        filename: function (req, file, callback) {
            callback(null, id(8)+".jpg");
        }
    });
    var upload = multer({ storage : storage}).single("profile_photo");
    console.log("get");
    upload(req,res,function(err) {
        if(err)
        {
            console.log("error occurs while uploaded");
        }
        else
        {
            console.log("success");
            res.send("success");
        }
    });*/

   /* fs.readFile(req.file.path,function(err,data)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            var filepath=__dirname+"/public/assests/images/profileimages/"+id(8)+".jpg";
            fs.writeFile(filepath,data,function(err,k)
            {
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    console.log("successfully stored in the images folder");
                    res.send("success");
                }
            });
        }
    });*/
});

router.get('/home', function(req, res, next) {
    console.log("home");
    res.render('home', { title: 'YIC' });
});
router.get('/projects', function(req, res, next) {
    res.render('projects', { title: 'YIC' });
});
router.get('/dashboard', function(req, res, next) {
    res.render('dashboard', { title: 'YIC' });
});
router.get('/events', function(req, res, next) {
    res.render('events', { title: 'YIC' });
});
router.get('/collages', function(req, res, next) {
    res.render('collages', { title: 'YIC' });
});
router.get('/users', function(req, res, next) {
    res.render('users', { title: 'YIC' });
});
router.get('/settings', function(req, res, next) {
    res.render('settings', { title: 'YIC' });
});
router.get('/profile', function(req, res, next) {
    res.render('profile', { title: 'YIC' });
});
router.post('/get_sample',function (req,res,next) {
    res.send('getting response');
});
module.exports = router;
