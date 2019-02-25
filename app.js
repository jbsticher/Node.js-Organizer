const express = require('express');
const exphbs  = require('express-handlebars');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();

//Connect to mongoose
mongoose.connect('mongodb://localhost/todostuff-dev', 
    // useMongoClient: true - this has beeen deprecated....
    { useNewUrlParser: true })
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err));

//Load Idea Model
require('./models/toDo');
const toDo = mongoose.model('toDo');

// Handlebars Middleware
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Method override middleware
app.use(methodOverride('_method'));

// Express Session middleware...
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  }));

app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});


// Index Route
app.get('/', (req, res) => {
    const title = 'Welcome';
    res.render('index', {
        title:title
    });
});

// About Route
app.get('/about', (req, res) => {
    res.render('about');
});

// Todo Index Page 
app.get('/todo', (req, res) => {
    toDo.find({})
    .sort({date:'desc'})
    .then(todo => {
        res.render('todo/index', {
        todo:todo
    });
  });
});

// Add Todo Form
app.get('/todo/add', (req, res) => {
    res.render('todo/add');
});

// Edit Todo Form
app.get('/todo/edit/:id', (req, res) => {
    toDo.findOne ({
        _id: req.params.id
    })
    .then(todo => {
     res.render('todo/edit', {
         todo:todo
     });
  });
});

// Process Form
app.post('/todo', (req, res) => {
  let errors = [];

  if(!req.body.title) {
      errors.push({text:'Please add a title'});
  }
  if(!req.body.details){
      errors.push({text:'Please enter your details'});
  }

  if(errors.length > 0) {
      res.render('todo/add', {
          errors: errors,
          title: req.body.title,
          details: req.body.details
      });
  } else {
      const newUser = {
        title: req.body.title,
        details: req.body.details
      }
      new toDo(newUser)
      .save()
      .then(toDo => {
        req.flash('success_msg', 'Todo added');
          res.redirect('/todo');
      })
  }
});

// Edit Form process
app.put('/todo/:id', (req, res) => {
    toDo.findOne({
        _id: req.params.id
    })
    .then(todo => {
        todo.title = req.body.title;
        todo.details = req.body.details;

        todo.save()
        .then(todo => {
            req.flash('success_msg', 'Todo updated');
            res.redirect('/todo');
        })
    })
});

// Delete Todo
app.delete('/todo/:id', (req, res) => {
    toDo.remove({_id: req.params.id})
    .then(() => {
        req.flash('success_msg', 'Todo removed');
        res.redirect('/todo');
    });
});

const port = 5000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});