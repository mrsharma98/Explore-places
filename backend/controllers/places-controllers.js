const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error')
const getCoordsForAddress = require('../util/location')
const Place = require('../models/place');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');


const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid

  let place;
  try {
    place = await Place.findById(placeId)
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a place', 500
    )
    return next(error)
  }

  if (!place) {
    // return res.status(404).json({ message: 'Could not find a place for the provided id.' })

    // triggering the error middleware
    // 2 ways to send, either by using Throwing Error, or using next()
    // in Async always use next()
    // const error = new Error('Could not find a place for the provided id.')
    // error.code = 404
    // throw error

    // using Custom HttpError Class
    // throw new HttpError('Could not find a place for the provided id.', 404)

    const error = new HttpError(
      'Could not find a place for the provided id.', 404
    )
    return next(error)

  }

  res.json({ place: place.toObject({ getters: true }) })
}

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid

  // let places
  let userWithPlaces;
  try {
    // places = await Places.find({creator: userId})
    userWithPlaces = await User.findById(userId).populate('places')
    console.log(userWithPlaces);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a place', 500
    )
    return next(error)
  }

  // if (!places || places.length === 0)
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    // return res.status(404).json({ message: 'Could not find a place for the provided id.' })
    // const error = new Error('Could not find a place for the provided user id.')
    // error.code = 404

    return next(
      new HttpError('Could not find places for the provided user id.', 404)
    );
  }

  res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) })
}

const createPlace = async (req, res, next) => {

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422))
  }

  const { title, description, address, creator } = req.body

  let coordinates
  try {
    coordinates = await getCoordsForAddress(address)
  } catch (error) {
    return next(error)
  }

  const createdPlace = Place({
    title,
    description,
    address,
    location: coordinates,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg',
    creator
  })

  let user

  try {
    user = await User.findById(creator)
  } catch (err) {
    const error = new HttpError(
      'creating place failed, please try again',
      500
    )
    return next(error)
  }

  if (!user) {
    const error = new HttpError(
      'Could not find user for provided id',
      404
    )
    return next(error)
  }

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await createdPlace.save({ session: sess })
    user.places.push(createdPlace)
    await user.save({ session: sess })
    await sess.commitTransaction()

  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    )

    return next(error)
  }

  res.status(201).json({ place: createdPlace })

}

const updatePlace = async (req, res, next) => {

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    )
  }

  const { title, description } = req.body
  const placeId = req.params.pid

  let place
  try {
    place = await Place.findById(placeId)
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update place', 500
    )
    return next(error)
  }

  place.title = title
  place.description = description

  try {
    await place.save()
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update place', 500
    )
    return next(error)
  }

  res.status(200).json({ place: place.toObject({ getters: true }) })

}

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid
  let place;
  try {
    place = await Place.findById(placeId).populate('creator')
    // populate:- it allows us to refer to a document stored in other collection
    // and to work with data in that existing document of that other collection
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place', 500
    )
    return next(error)
  }

  if (!place) {
    const error = new HttpError('Could not find place for this id', 404)
    return next(error)
  }

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await place.remove({ session: sess })
    place.creator.places.pull(place)
    await place.creator.save({ session: sess })
    await sess.commitTransaction()

  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place', 500
    )
    return next(error)
  }

  res.status(200).json({ message: "Deleted place" })
}


exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace