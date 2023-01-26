const fs = require('fs')
const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv').config()

const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/users-routes')
const HttpError = require('./models/http-error')

app = express()

app.use(bodyParser.json())

// for images
app.use('/uploads/images', express.static(path.join('uploads', 'images')))

// for cors
app.use((req, res, next) => {
  // setting headers for the req
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  next()
})

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

// Handling all req if we don't get response from on of our placesRoutes
app.use((req, res, next) => {
  const error = new HttpError('Could not find this route', 404);
  throw error
})


// Special middleware, gets attached the every single request that comes
// will get execute when any middleware before it yields an error
app.use((error, req, res, next) => {
  if (req.file) {
    // if we get any error while signing up, but files gets upload
    // so this will delete it.
    // multer adds the file to the req.
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    })
  }
  // check if res has already being send
  if (res.headerSend) {
    return next(error)
  }

  res.status(error.code || 500)
  res.json({ message: error.message || 'An unknown error occured!' })
})



mongoose.set('strictQuery', false);
mongoose
  .connect(`mongodb+srv://${dotenv.parsed.MONGO_USER}:${dotenv.parsed.MONGO_PASSWORD}@sandbox.jkb6emv.mongodb.net/mern?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(5000)
  })
  .catch(err => {
    console.log(err);
  })

