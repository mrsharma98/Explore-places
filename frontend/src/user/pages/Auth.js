import React, { useState, useContext } from "react"

import Button from "../../shared/components/FormElements/Button"
import Input from "../../shared/components/FormElements/Input"
import Card from "../../shared/components/UIElements/Card"
import { useForm } from "../../shared/hooks/form-hook"
import { useHttpClient } from "../../shared/hooks/http-hook"
import { VALIDATOR_EMAIL, VALIDATOR_MINLENGTH, VALIDATOR_REQUIRE } from "../../shared/util/Validators"
import { AuthContext } from "../../shared/context/auth-context"
import ErrorModal from '../../shared/components/UIElements/ErrorModal'
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner'
import ImageUpload from "../../shared/components/FormElements/ImageUpload"

import './Auth.css'

const Auth = () => {
  const auth = useContext(AuthContext)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const { isLoading, error, sendRequest, clearError } = useHttpClient()

  const [formState, inputHandler, setFormData] = useForm(
    {
      email: {
        value: '',
        isValid: false
      },
      password: {
        value: '',
        isValid: false
      }
    },
    false
  )

  const switchModeHandler = () => {
    if (!isLoginMode) {
      setFormData({
        ...formState.inputs,
        name: undefined,
        image: undefined
      }, formState.inputs.email.isValid && formState.inputs.password.isValid)
    } else {
      setFormData({
        ...formState.inputs,
        name: {
          value: '',
          isValid: false
        },
        image: {
          value: null,
          isValid: false
        }
      }, false)
    }
    setIsLoginMode(prevMode => !prevMode)
  }

  const authSubmitHandler = async (event) => {
    event.preventDefault()
    // console.log(formState.inputs);

    let url, data;

    // if user is loggin in
    if (isLoginMode) {
      try {
        url = 'http://localhost:5000/api/users/login'
        data = JSON.stringify({
          email: formState.inputs.email.value,
          password: formState.inputs.password.value
        })

        const responseData = await sendRequest(
          url,
          'POST',
          data,
          { 'Content-Type': 'application/json' }
        )

        auth.login(responseData.user.id)
      } catch (err) { }



    } else {
      // if user wants to signup

      url = 'http://localhost:5000/api/users/signup'
      const formData = new FormData()
      formData.append('email', formState.inputs.email.value)
      formData.append('name', formState.inputs.name.value)
      formData.append('password', formState.inputs.password.value)
      formData.append('image', formState.inputs.image.value)

      try {

        const responseData = await sendRequest(
          url,
          'POST',
          formData
        )

        auth.login(responseData.user.id)

      } catch (err) { }
    }

  }

  return (
    <React.Fragment>
      <ErrorModal
        error={error}
        onClear={clearError}
      />

      <Card className='authentication'>
        {isLoading && <LoadingSpinner asOverlay />}

        <h2>Login Required</h2>
        <hr />
        <form onSubmit={authSubmitHandler}>
          {!isLoginMode && (
            <Input
              id="name"
              label="Your Name"
              element="input"
              type="text"
              validators={[VALIDATOR_REQUIRE()]}
              errorText="Please enter your name"
              onInput={inputHandler}
            />
          )}
          {!isLoginMode && (
            <ImageUpload
              center
              id="image"
              onInput={inputHandler}
              errorText="Please provide an image."
            />
          )}
          <Input
            id="email"
            label="Email"
            element="input"
            type="email"
            validators={[VALIDATOR_EMAIL()]}
            errorText="Please enter a valid email"
            onInput={inputHandler}
          />
          <Input
            id="password"
            label="Password"
            element="input"
            type="password"
            validators={[VALIDATOR_MINLENGTH(6)]}
            errorText="Please enter a valid password, at least 6 characters."
            onInput={inputHandler}
          />
          <Button type="submit" disabled={!formState.isValid}>
            {isLoginMode ? 'LOGIN' : 'SIGNUP'}
          </Button>
        </form>

        <Button inverse onClick={switchModeHandler}>SWITCH TO {isLoginMode ? 'SIGNUP' : 'LOGIN'}</Button>
      </Card>
    </React.Fragment>
  )
}

export default Auth