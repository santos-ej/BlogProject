import express from "express";
import {dirname} from "path";
import { fileURLToPath} from "url";
import path from "path";
import fs from "fs";
import session from 'express-session';


const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
let accounts = [];
let blogs = [];

//Middlewares
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//session set up
app.use(session({
  secret: 'your_secret_key', // Change this to a strong secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));


//functions for JSON
const loadBlogData = () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname,'data','data.json'),'utf-8'));
  const activeData = data.filter(blog => blog.isDeleted === false); 
  return activeData;
}

const loadAllBlogDataForUpdate = () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname,'data','data.json'),'utf-8'));
  return data;
}

const loadBlogDataById = (paramBlogId) => {

  const newBlogId = parseInt(paramBlogId);
  console.log("loadBlogDataById:Id :::" + newBlogId); 
  
  if(newBlogId === 0){
    return [];
    console.log("loadBlogDataById:Id ::: no data returned" ); 
  }

  else {
  const blogs = loadBlogData();
  console.log("loadBlogDataById:Id ::: blogs value ::: " + blogs ); 
  let returnValue = blogs.find( blogItem => blogItem.id === newBlogId);
  console.log("loadBlogDataById:Id ::: data returned ::: " + returnValue ); 
  return returnValue; 
  
  }
}

const loadBlogDataByEmail = (email) => {

  if(email === ''){
    return [];
  }
  else {
  const blogs = loadBlogData();
  let returnValue = blogs.filter(item => typeof item['createdBy'] === 'string' && item['createdBy'].toLowerCase().includes(email.toLowerCase()));
  return returnValue; 
  }
}

const loadOtherBlogDataExcludeCurrentUser = (email) => {

    if(email === '' ){
    return [];
    
  }
  else {
  const blogs = loadBlogData();
  let returnValue = blogs.filter(item => typeof item['createdBy'] === 'string' && !item['createdBy'].toLowerCase().includes(email.toLowerCase()));

  return returnValue; 
  }
}

const saveData = (data) => {
  fs.writeFileSync(path.join(__dirname,'data','data.json'), JSON.stringify(data, null, 2));
};

const loadAllAccountData = () => {  
  const activeAccounts = JSON.parse(fs.readFileSync(path.join(__dirname,'data', 'accounts.json'),'utf-8'));
  return activeAccounts;
}

const loadAccountData = () => {  
  const data = JSON.parse(fs.readFileSync(path.join(__dirname,'data', 'accounts.json'),'utf-8'));
  const activeAccounts = data.filter(acc => acc.isActive === true); 
  return activeAccounts;
}

const saveAccount = (data) => {
  fs.writeFileSync(path.join(__dirname,'data','accounts.json'), JSON.stringify(data, null, 2));
};

const getAccountByUsername = (username) => {
  console.log(username);                                       
};

const setBlogToDeletedById = (paramBlogId, currentUser) => {

  let allBlogs = loadBlogDataById(paramBlogId);
  let blogToUpdate = allBlogs.find(blog => blog.id === parseInt(paramBlogId));

  if (!blogToUpdate) {
    return res.status(404).send("Blog not found"); 
  }

  blogToUpdate.isDeleted = false; 
  blogToUpdate.udpatedAt = new Date();
  blogToUpdate.updateBy = currentUser; 

  saveData(allBlogs);
}

//go to / page
app.get("/", (req,res) => {
  const toast = req.session.toast;
                req.session.toast = null;
  delete req.session.toast;
  const otherBlogItems = loadBlogData(); 


  res.render("index.ejs",
    {
      title: "Home",
      hideSignUp : false,
      hideLogin : false,
      hideLogout: true,
      username : req.session.email,
      otherBlogItems,
      toast
  }); 

});

//go to home page
app.get("/home", (req, res) => {
  
  const toast = req.session.toast;
  delete req.session.toast;


  if (req.session.email) {

      const myBlogItems = loadBlogDataByEmail(req.session.email);
      const otherBlogItems = loadOtherBlogDataExcludeCurrentUser(req.session.email); 

    res.render('Home', {     
      title: "Welcome",
      hideSignUp : true,
      hideLogin : true,
      hideLogout: false,
      username : req.session.email,
      myBlogItems,
      otherBlogItems,
      toast 
    });
 } else {
     
  const otherBlogItems = loadBlogData();
    res.render("index.ejs",
    {
      title: "Home",
      hideSignUp : false,
      hideLogin : false,
      hideLogout: true,
      username : req.session.email,
      otherBlogItems
    }); 
  }
}); 

//go to sign up page
app.get("/sign-up", (req,res) => {
  res.render("sign-up.ejs",{
    title: "Sign Up",
    hideSignUp : false,
    hideLogin : true,
    hideLogout: true
  }); 
}); 

//sign up new accounts upon click of the sign up button - incomplete
app.post('/sign-up', (req, res) => {

  //checks for missing values
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Missing email or password');
  }

  //initialize
  let createdAt = new Date(); 
  let accounts = [];
  let isActive = true;


  //sync JSON data
  accounts = loadAllAccountData();
  
  //validate if email exist in the JSON file
  const exists = accounts.some(acc => acc.email === email); 
  console.log("check if account exist: " + exists);
  
  if (exists) {
    req.session.toast = { type: 'warning', message: 'Email already registered!' }; 
    return res.render('sign-up.ejs', {
      toast: req.session.toast,
      hideSignUp : true,
      hideLogin : false,
      hideLogout: true
    });
  }

  console.log("accounts length:  " + accounts.length); 

  //check last Id from the JSON file
  let lastRecordId = accounts.length === 0 ? 1 : accounts[accounts.length - 1].id + 1;
  console.log("last record Id: " + lastRecordId); 

// assign the values 
  const newAccountJSON = {
            "id": lastRecordId,
            "username": email,
            "password": password,
            "email": email,
            "fullName":  email,
            "createdAt": createdAt,
            "isActive": isActive
        };
  
  //create new data
  accounts.push(newAccountJSON);
  //commit changes
  saveAccount(accounts);

  req.session.toast = { type: 'success', message: 'Account has been created.' };
  res.render ('/login'); 

});
 
//go to login page
app.get("/login", (req,res) => {
  res.render("login.ejs",{
    action: "/login",
    title: "Login",
    hideSignUp : true,
    hideLogin : false,
    hideLogout: true,
    accounts
  }); 
}); 

//Upon click of the login button
app.post("/login", (req, res) => {

  const { email, password, action } = req.body;
  let accounts = loadAccountData();
  
  //validate if email exist in the JSON file
  const exists = accounts.find(acc => acc.email === email && acc.password === password); 
  console.log("check if account exist: " + exists);
  
  if (exists) {
      console.log('redirecting to home...');
      req.session.email = exists.email;
      console.log(req.session.email);
      req.session.toast = null;
      res.redirect('/home');

  } else
  {
    req.session.toast = { type: 'warning', message: 'Account does not exist!' }; 
    return res.render('login.ejs', 
      {toast: req.session.toast, 
          hideSignUp : false,
          hideLogin : true,
          hideLogout: true 
      });
    // res.redirect('/login'); 
  }
});

//go to forgot password page
app.get("/forgot-password", (req,res) => {
  res.render("forgot-password.ejs",{
    title: "Forgot Password",
    hideSignUp : false,
    hideLogin : false,
    hideLogout: true 
  }); 
}); 

app.post("/forgot-password", (req,res) => {

  console.log('enters forgot password POST');

  const { inputEmail,inputPasswordNew,inputPasswordConfirm } = req.body;
  console.log(inputEmail);
  console.log(inputPasswordNew);
  console.log(inputPasswordConfirm);
  
  req.session.toast = null;

    let allAccounts = []; 
        allAccounts = loadAccountData(); 

    let accountToUpdate = allAccounts.find(acc => acc.email === inputEmail);
    console.log(accountToUpdate);

    if (!accountToUpdate) {
      console.log('ACCOUNT NOT FOUND');
      return res.status(404).send("Account not found");
    }

    console.log('ACCOUNT FOUND!');

     if (inputPasswordNew !== inputPasswordConfirm) {
      console.log('passwords are not match');
      
      req.session.toast = { type: 'error', message: 'Passwords are not match!' };

      return res.render('forgot-password.ejs', { warning: 'Email not found.', inputPasswordNew: '', inputPasswordConfirm: '', toast: req.session.toast});
      //return req.session.toast = { type: 'error', message: 'Passwords are not match!' }, inputPasswordNew = "", inputPasswordConfirm = "" ;
            
    }
      accountToUpdate.password = inputPasswordNew;
      console.log(inputPasswordNew);

      saveAccount(allAccounts);
      req.session.toast = { type: 'success', message: 'Password updated successfully.' };
      
      return res.render('forgot-password.ejs', {toast: req.session.toast});
      //res.redirect('/login');
}); 


app.get('/logout', (req, res) => {
  console.log('logged out successfully!'); 
  req.session.destroy(err => {
      if (err) {
          return res.redirect('/home'); // Handle error during logout
      }
      res.redirect('/login'); // Redirect to login after logout
  });
});

app.get('/sign-up', (req, res) => {
  res.json(accounts);
});

app.get('/sign-up:id', (req, res) => {
  const account = accounts.find(b => b.id === parseInt(req.params.id));

  if (!account) {
    return res.status(404).send('Account not found');
  }
  res.json(account);
});

app.delete('/sign-up/:id', (req, res) => {
  const accountIndex = accounts.findIndex(b => b.id === parseInt(req.params.id));
  if (accountIndex === -1) {
    return res.status(404).send('Account not found');
  }

  accounts.splice(accountIndex, 1);
  res.status(204).send();
});

//Blogs
//go to write blog page
app.get("/write-blog", (req,res) => {
  
  res.render("write-blog.ejs",{
    title: "Write a Blog", 
    username: req.session.username
  }); 
}); 

app.get('/write-blog', (req, res) => {
  res.json(blogs);
});

app.post('/write-blog', (req, res) => {

   if (req.session.email) {
    const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).send('Missing title or content');
  }

  const jsonFilePath = path.join(__dirname,'data', 'data.json');  
  let allBlogs = []; 
      allBlogs = loadAllBlogDataForUpdate(); 
  let dateToday = new Date(); 
  
  console.log('blog length:' + allBlogs.length);

  const newBlog = { 
    "id": allBlogs.length + 1, 
    "title": title,
    "content": content,
    "isDeleted": false,
    "createdBy": req.session.email,  
    "createdAt":dateToday,
    "updateBy": req.session.email, 
    "udpatedAt": dateToday
  };

  console.log(newBlog);

  //insert the new JSON data in the allBlogs
  allBlogs.push(newBlog);

   //commit changes
  fs.writeFileSync(jsonFilePath, JSON.stringify(allBlogs, null, 2));
  
  //res.status(201).send(newBlog);
  req.session.toast = { type: 'success', message: 'Blog created successfully!' };
  res.redirect('/home');

 } else {
     res.redirect('/login');
   }

});

app.get('/view-blog/:id', (req, res) => {
  
  if (req.session.email) {
    const paramBlogId = req.params.id;
    console.log("entered in the write blog with Id: " + paramBlogId); 
    const getBlog = loadBlogDataById(paramBlogId); // from your JSON
    console.log("blog data: " + getBlog); 
  
    if (!getBlog) {
    return res.redirect('404.ejs');
    }

    res.render('view-blog', { 
      title : "View Blog",
      hideSignUp : true,
      hideLogin : true,
      hideLogout: false,
      getBlog, 
      username: req.session.email
    });
 } 
 else {
   res.redirect('/login');
  }

});

app.post('/view-blog/:id', (req, res) => {
  
console.log('view blog POST');

if (req.session.email) {
  const action = req.body.deleteButton; 
  console.log(action);

  if (!action) {
    return res.status(400).send('Missing req action');
  }

  let blogId = req.params.id; 
  let allBlogs = []; 
      allBlogs = loadAllBlogDataForUpdate(); 
  let blogToUpdate = allBlogs.find(blog => blog.id === parseInt(blogId));

if (!blogToUpdate) {
  return res.status(404).send("Blog not found");
}

if (action === 'soft-delete') {
    console.log('view blog - case - soft delete');
    blogToUpdate.isDeleted = true; 
    blogToUpdate.updateBy = req.session.email;
    req.session.toast = { type: 'success', message: 'The blog is deleted successfully!' };
    saveData(allBlogs);
}
else{
    console.log('view blog - case - else');
    req.session.toast = { type: 'success', message: 'Else condition was triggered!' };
}

  res.redirect('/home');
 } 
 else {
   res.redirect('/login');
  }

});

app.get("/edit-blog", (req,res) => {
  res.render("edit-blog.ejs",{
    title: "Edit Blog", 
    username: req.session.username
  }); 
}); 

app.get('/edit-blog/:id', (req, res) => {
    const paramBlogId = req.params.id;
    console.log("entered in the edit blog with Id: " + paramBlogId); 
    const getBlog = loadBlogDataById(paramBlogId); // from your JSON
    console.log("blog data: " + getBlog); 

  if (!getBlog) {
    return res.render('404.ejs');
    }
    else {

      console.log('get blog data.' + getBlog);
      res.render('edit-blog', { 
      title : "Edit Blog",
      hideSignUp : true,
      hideLogin : true,
      hideLogout: false,
      getBlog, 
      username: req.session.email
    });
  }
});

app.post('/edit-blog/:id', (req, res) => {

   if (req.session.email) {
    const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).send('Missing title or content');
  }

  let blogId = req.params.id; 
  console.log('blog Id to update:' +  blogId); 
  let allBlogs = []; 
      allBlogs = loadAllBlogDataForUpdate(); 
  console.log('all blogs:' +  allBlogs); 
  let dateToday = new Date(); 

  let blogToUpdate = allBlogs.find(blog => blog.id === parseInt(blogId));
  console.log('blog to update:' +  blogToUpdate); 

if (!blogToUpdate) {
  return res.status(404).send("Blog not found");
}

  blogToUpdate.title = title.trim();
  blogToUpdate.content = content.trim();
  blogToUpdate.udpatedAt = dateToday;
  blogToUpdate.updateBy = req.session.email;

  saveData(allBlogs);
  req.session.toast = { type: 'success', message: 'Blog updated!' };
  res.redirect('/home');
 } else {
     res.redirect('/login');
   }

});

app.delete('/write-blog/:id', (req, res) => {
  const blogIndex = blogs.findIndex(b => b.id === parseInt(req.params.id));
  if (blogIndex === -1) {
    return res.status(404).send('Blog not found');
  }

  blogs.splice(blogIndex, 1);
  res.status(204).send();
});

// go to about page
app.get("/about", (req,res) => {

let hideLoginButton; 

  if (req.session.email) {
    hideLoginButton = true; 
 } else {
    hideLoginButton = false;
  }
  res.render("about.ejs",{
    title: "About",
    hideSignUp : hideLoginButton,
    hideLogin : hideLoginButton,
    hideLogout: !hideLoginButton
  }); 
}); 

//go to FAQ
app.get("/faq", (req,res) => {
 
let hideLoginButton; 

  if (req.session.email) {
    hideLoginButton = true; 
 } else {
    hideLoginButton = false;
  }

  res.render("faq.ejs",{
    title: "FAQ",
    hideSignUp : hideLoginButton,
    hideLogin : hideLoginButton,
    hideLogout: !hideLoginButton
  }); 
}); 

app.get("/404", (req,res) => {

let hideLoginButton; 

  if (req.session.email) {
    hideLoginButton = true; 
 } else {
    hideLoginButton = false;
  }
  res.render("404.ejs",{
    title: "404",
    hideSignUp : hideLoginButton,
    hideLogin : hideLoginButton,
    hideLogout: !hideLoginButton
  }); 
}); 

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
  

