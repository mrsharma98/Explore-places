const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error')
const getCoordsForAddress = require('../util/location')

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous sky scrapers in the world!',
    location: {
      lat: 40.7484474,
      lng: -73.9871516
    },
    address: '20 W 34th St, New York, NY 10001',
    creator: 'u1'
  }
];

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid
  const place = DUMMY_PLACES.find((place) => placeId === place.id)

  if (!place) {
    // return res.status(404).json({ message: 'Could not find a place for the provided id.' })

    // triggering the error middleware
    // 2 ways to send, either by using Throwing Error, or using next()
    // in Async always use next()
    // const error = new Error('Could not find a place for the provided id.')
    // error.code = 404
    // throw error

    // using Custom HttpError Class
    throw new HttpError('Could not find a place for the provided id.', 404)

  }

  res.json({ place })
}

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid
  const places = DUMMY_PLACES.filter(p => (
    p.creator === userId
  ))

  if (!places || places.length === 0) {
    // return res.status(404).json({ message: 'Could not find a place for the provided id.' })
    // const error = new Error('Could not find a place for the provided user id.')
    // error.code = 404

    return next(
      new HttpError('Could not find places for the provided user id.', 404)
    );
  }

  res.json({ places })
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


  const createdPlace = {
    id: uuid(),
    title,
    description,
    address,
    location: coordinates,
    creator
  }

  DUMMY_PLACES.push(createdPlace)

  res.status(201).json({ place: createdPlace })

}

const updatePlace = (req, res, next) => {

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed, please check your data.', 422)
  }

  const { title, description } = req.body
  const placeId = req.params.pid

  const updatedPlace = {
    ...DUMMY_PLACES.find(place => (
      place.id === placeId
    ))
  }

  const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId)

  updatedPlace.title = title
  updatedPlace.description = description

  DUMMY_PLACES[placeIndex] = updatedPlace

  res.status(200).json({ place: updatedPlace })

}

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid

  const placeExist = DUMMY_PLACES.find(p = p.id === placeId)
  if (!placeExist) {
    throw new HttpError('Could not find a place for that id', 404)
  }

  DUMMY_PLACES = DUMMY_PLACES.filter(place => (
    place.id !== placeId
  ))

  res.status(200).json({ message: "Deleted place" })
}


exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace