const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/users-routes')
const HttpError = require('./models/http-error')

app = express()

app.use(bodyParser.json())

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
  // check if res has already being send
  if (res.headerSend) {
    return next(error)
  }

  res.status(error.code || 500)
  res.json({ message: error.message || 'An unknown error occured!' })
})

mongoose.set('strictQuery', false);
mongoose
  .connect('mongodb+srv://exploreplace:exploreplace@sandbox.jkb6emv.mongodb.net/places?retryWrites=true&w=majority')
  .then(() => {
    app.listen(5000)
  })
  .catch(err => {
    console.log(err);
  })

