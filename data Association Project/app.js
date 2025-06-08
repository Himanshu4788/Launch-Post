const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');

const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const post = require('./models/post');

app.set('view engine', "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render("index.ejs");
});


//login route
app.get('/login', (req, res) => {
    res.render("login.ejs");
});


//logout route
app.get('/logout', (req, res) => {
    res.render("logout.ejs");
});



app.get('/like/:id',isloggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    

    //  if (!post.likes) post.likes = [];
    // console.log(typeof(req.user.userid));
    // console.log(typeof(post.likes));
    
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }


    else
     {
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
     }
  
  
    await post.save();
    res.redirect("/profile");
});


app.get('/edit/:id',isloggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    
    res.render("edit.ejs" , {post})
});

//user profile 
app.get('/profile', isloggedIn, async (req, res) => {
//    console.log("req.user =", req.user); // <--- check if this prints correctly
//    if (!req.user) return res.redirect('/login');

   const user = await userModel.findOne({ email: req.user.email }).populate("posts");
//    if (!user) return res.status(404).send("User not found");

   res.render("profile.ejs", {user});
});




// Register Route
app.post('/register', async (req, res) => {
    const { username, name, email, age, password } = req.body;
    
    const user = await userModel.findOne({ email });
    if (user) {
        return res.status(500).send("already occupied");
    }
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const newUser = await userModel.create({
                username,
                name,
                email,
                age,
                password: hash
            });
            const token = jwt.sign({ email: email, userid: newUser._id }, "shhh");
            res.cookie("token", token);
            res.redirect("\login");
        });
    });
});


// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(500).send("something went wrong ");
    }
    
    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            const token = jwt.sign({ email: email, userid: user._id }, "shhh");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
            
        } else {
            res.status(400).send("Invalid credentials");
        }
    });
});


//logout
app.post('/logout', async (req, res) => {
    const { email , password } = req.body;
    
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(500).send("something went wrong");
    }
    await userModel.findOneAndDelete({ email });
    res.clearCookie('token');
    res.status(200).send(`User has been deleted.`);
    
    
});


//user profile 
app.post('/post',isloggedIn, async (req, res) => {
    // console.log(req.user);
 let user=  await userModel.findOne({email: req.user.email})
//  console.log(req.user);
 
 let {content} = req.body;
 let post = await postModel.create({
    user:user._id,
    content:content
 })

 user.posts.push(post._id);
 await user.save()  
 res.redirect("/profile");

});

//update post 
app.post('/update/:id',isloggedIn, async (req, res) => {
    // console.log(req.user);
 let post=  await postModel.findOneAndUpdate({_id:req.params.id} , {content : req.body.content})

 res.redirect("/profile");

});






//middleware
function isloggedIn(req,res,next)
{
    if(!req.cookies.token ) res.redirect("/login");
 
        let data = jwt.verify(req.cookies.token , "shhh");
        req.user = data;
        next();
    
 }


app.listen(3000, () => {
    console.log('its running');
});
