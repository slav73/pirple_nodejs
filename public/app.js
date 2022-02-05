/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {}

// Config
app.config = {
  sessionToken: false,
}

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function(
  headers,
  path,
  method,
  queryStringObject,
  payload,
  callback
) {
  // Set defaults
  headers = typeof headers == 'object' && headers !== null ? headers : {}
  path = typeof path == 'string' ? path : '/'
  method =
    typeof method == 'string' &&
    ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1
      ? method.toUpperCase()
      : 'GET'
  queryStringObject =
    typeof queryStringObject == 'object' && queryStringObject !== null
      ? queryStringObject
      : {}
  payload = typeof payload == 'object' && payload !== null ? payload : {}
  callback = typeof callback == 'function' ? callback : false

  // For each query string parameter sent, add it to the path
  var requestUrl = path + '?'
  var counter = 0
  for (var queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++
      // If at least one query string parameter has already been added, prepend new ones with an ampersand
      if (counter > 1) {
        requestUrl += '&'
      }
      // Add the key and value
      requestUrl += queryKey + '=' + queryStringObject[queryKey]
    }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest()
  xhr.open(method, requestUrl, true)
  xhr.setRequestHeader('Content-type', 'application/json')

  // For each header sent, add it to the request
  for (var headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey])
    }
  }

  // If there is a current session token set, add that as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader('token', app.config.sessionToken.id)
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      var statusCode = xhr.status
      var responseReturned = xhr.responseText

      // Callback if requested
      if (callback) {
        try {
          var parsedResponse = JSON.parse(responseReturned)
          callback(statusCode, parsedResponse)
        } catch (e) {
          callback(statusCode, false)
        }
      }
    }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload)
  xhr.send(payloadString)
}

app.bindLogoutButton = function() {
  document
    .getElementById('logoutButton')
    .addEventListener('click', function(e) {
      e.preventDefault()
      app.logUserOut()
    })
}

app.logUserOut = function() {
  var tokenId =
    typeof app.config.sessionToken.id === 'string'
      ? app.config.sessionToken.id
      : false

  var queryStringObject = {
    id: tokenId,
  }

  app.client.request(
    undefined,
    'api/tokens',
    'DELETE',
    queryStringObject,
    undefined,
    function() {
      app.setSessionToken(false)
      localStorage.removeItem('token')
      window.location = '/session/deleted'
    }
  )
}

app.deleteUser = function() {
  var phone =
    typeof app.config.sessionToken.phone === 'string'
      ? app.config.sessionToken.phone
      : false

  var queryStringObject = {
    phone,
  }

  app.client.request(
    undefined,
    'api/users',
    'DELETE',
    queryStringObject,
    undefined,
    function(statusCode, responsePayload) {
      app.setSessionToken(false)
      localStorage.removeItem('token')
      window.location = '/account/deleted'
    }
  )
}

// Bind the forms
app.bindForms = function() {
  var forms = document.querySelectorAll('form')
  if (forms) {
    forms.forEach((form) => {
      document
        .querySelector('#' + form.id)
        .addEventListener('submit', function(e) {
          // Stop it from submitting
          e.preventDefault()
          var formId = this.id
          var path = this.action
          var method =
            this.id === 'accountEdit1' ||
            this.id === 'accountEdit2' ||
            this.id === 'checksEdit1'
              ? 'PUT'
              : this.method.toUpperCase()
          if (this.id === 'accountEdit3') method = 'DELETE'

          // Hide the error message (if it's currently shown due to a previous error)
          document.querySelector('#' + formId + ' .formError').style.display =
            'hidden'

          // Turn the inputs into a payload
          var payload = {}
          var elements = this.elements
          payload.successCodes = []
          for (var i = 0; i < elements.length; i++) {
            if (elements[i].type !== 'submit') {
              if (elements[i].name === 'successCodes' && elements[i].checked) {
                console.log('Checked selection', elements[i].value)
                payload.successCodes.push(elements[i].value)
              } else {
                if (elements[i].name !== 'successCodes') {
                  payload[elements[i].name] = elements[i].value
                }
              }
            }
          }
          console.log('Payload: ', payload)

          // payload.timeoutSeconds = 2
          // Call the API
          app.client.request(
            undefined,
            path,
            method,
            undefined,
            payload,
            function(statusCode, responsePayload) {
              console.log('Payload: ', responsePayload)
              // Display an error on the form if needed
              if (statusCode !== 200) {
                // Try to get the error from the api, or set a default error message
                var error =
                  typeof responsePayload.Error == 'string'
                    ? responsePayload.Error
                    : 'An error has occured, please try again'

                // Set the formError field with the error text
                document.querySelector(
                  '#' + formId + ' .formError'
                ).innerHTML = error

                // Show (unhide) the form error field on the form
                document.querySelector(
                  '#' + formId + ' .formError'
                ).style.display = 'block'
              } else {
                // If successful, send to form response processor
                app.formResponseProcessor(formId, payload, responsePayload)
              }
            }
          )
        })
    })
  }
}

// Form response processor
app.formResponseProcessor = function(formId, requestPayload, responsePayload) {
  var functionToCall = false

  if (formId == 'accountCreate') {
    var newPayload = {
      phone: requestPayload.phone,
      password: requestPayload.password,
    }

    app.client.request(
      undefined,
      'api/tokens',
      'POST',
      undefined,
      newPayload,
      function(newStatusCode, newResponsePayload) {
        if (newStatusCode !== 200) {
          document.querySelector('#' + formId + ' .formError').innerHTML =
            'Account create: Sorry, an error occured'
          document.querySelector('#' + formId + ' .formError').style.display =
            'block'
        } else {
          app.setSessionToken(newResponsePayload)
          window.location = '/checks/all'
        }
      }
    )
  }

  if (formId === 'sessionCreate') {
    app.setSessionToken(responsePayload)
    window.location = '/checks/all'
  }

  if (formId === 'accountEdit1') {
    var newPayload = {
      phone: requestPayload.phone,
      firstName: requestPayload.firstName,
      lastName: requestPayload.lastName,
    }
    var queryString = {
      phone: requestPayload.phone,
    }

    app.client.request(
      undefined,
      'api/users',
      'GET',
      queryString,
      newPayload,
      function(newStatusCode, newResponsePayload) {
        if (newStatusCode !== 200) {
          document.querySelector('#' + formId + ' .formError').innerHTML =
            'Edit account: Sorry, an error occured'
          document.querySelector('#' + formId + ' .formError').style.display =
            'block'
        } else {
          document.querySelector('#' + formId + ' .formSuccess').innerHTML =
            'Successfully changed User data'
          document.querySelector('#' + formId + ' .formSuccess').style.display =
            'block'
          app.setSessionToken(app.config.sessionToken)
        }
      }
    )
  }

  if (formId === 'accountEdit2') {
    var newPayload = {
      phone: requestPayload.phone,
      password: requestPayload.password,
    }
    var queryString = {
      phone: requestPayload.phone,
    }
    app.client.request(
      undefined,
      'api/users',
      'GET',
      queryString,
      newPayload,
      function(newStatusCode, newResponsePayload) {
        if (newStatusCode !== 200) {
          document.querySelector('#' + formId + ' .formError').innerHTML =
            'Password change: Sorry, an error occured'
          document.querySelector('#' + formId + ' .formError').style.display =
            'block'
        } else {
          document.querySelector('#' + formId + ' .formSuccess').innerHTML =
            'Successfully changed password'
          document.querySelector('#' + formId + ' .formSuccess').style.display =
            'block'
          app.setSessionToken(app.config.sessionToken)
        }
      }
    )
  }

  if (formId === 'accountEdit3') {
    var newPayload = {
      phone: requestPayload.phone,
    }

    app.client.request(
      undefined,
      'api/users',
      'GET',
      newPayload,
      newPayload,
      function(newStatusCode) {
        if (newStatusCode !== 404) {
          document.querySelector('#' + formId + ' .formError').innerHTML =
            'Deleting user: Sorry, an error occured'
          document.querySelector('#' + formId + ' .formError').style.display =
            'block'
        } else {
          window.location = '/account/deleted'
        }
      }
    )
  }

  if (formId == 'checksCreate') {
    window.location = '/checks/all'
  }
}

app.getSessionToken = function() {
  var tokenString = localStorage.getItem('token')
  if (typeof tokenString === 'string') {
    try {
      var token = JSON.parse(tokenString)
      app.config.sessionToken = token
      if (typeof token === 'object') {
        app.setLoggedInClass(true)
      } else {
        app.setLoggedInClass(false)
      }
    } catch (e) {
      app.config.sessionToken = false
      app.setLoggedInClass(false)
    }
  }
}

app.setLoggedInClass = function(add) {
  var target = document.querySelector('body')
  if (add) {
    target.classList.add('loggedIn')
  } else {
    target.classList.remove('loggedIn')
  }
}

app.setSessionToken = function(token) {
  app.config.sessionToken = token
  var tokenString = JSON.stringify(token)
  localStorage.setItem('token', tokenString)
  if (typeof token === 'object') {
    app.setLoggedInClass(true)
  } else {
    app.setLoggedInClass(false)
  }
}

app.renewToken = function(callback) {
  var currentToken =
    typeof app.config.sessionToken === 'object'
      ? app.config.sessionToken
      : false
  if (currentToken) {
    var queryStringObject = {
      id: currentToken.id,
      extend: true,
    }

    app.client.request(
      undefined,
      'api/tokens',
      'GET',
      queryStringObject,
      undefined,
      function(statusCode, responsePayload) {
        if (statusCode === 200) {
          app.setSessionToken(responsePayload)
          callback(false)
        } else {
          app.setSessionToken(false)
          callback(true)
        }
      }
    )
  } else {
    app.setSessionToken(false)
    callback(true)
  }
}

app.loadDataOnPage = function() {
  var bodyClasses = document.querySelector('body').classList
  var primaryClass = typeof bodyClasses[0] === 'string' ? bodyClasses[0] : false

  if (primaryClass === 'accountEdit') {
    app.loadAccountEditPage()
  }

  if (primaryClass === 'checksList') {
    app.loadChecksListPage()
  }

  if (primaryClass === 'checksEdit') {
    app.loadChecksEditPage()
  }
}

app.loadAccountEditPage = function() {
  var phone =
    typeof app.config.sessionToken.phone === 'string'
      ? app.config.sessionToken.phone
      : false
  if (phone) {
    var queryStringObject = {
      phone,
    }

    app.client.request(
      undefined,
      'api/users',
      'GET',
      queryStringObject,
      undefined,
      function(statusCode, responsePayload) {
        if (statusCode === 200) {
          document.querySelector('#accountEdit1 .firstNameInput').value =
            responsePayload.firstName
          document.querySelector('#accountEdit1 .lastNameInput').value =
            responsePayload.lastName
          document.querySelector('#accountEdit1 .displayPhoneInput').value =
            responsePayload.phone

          var hiddenPhoneInputs = document.querySelectorAll(
            'input.hiddenPhoneNumberInput'
          )

          for (var i = 0; i < hiddenPhoneInputs.length; i++) {
            hiddenPhoneInputs[i].value = responsePayload.phone
          }
        } else {
          app.logUserOut()
        }
      }
    )
  } else {
    app.logUserOut()
  }
}

app.loadChecksListPage = function() {
  var phone =
    typeof app.config.sessionToken.phone === 'string'
      ? app.config.sessionToken.phone
      : false
  if (phone) {
    var queryStringObject = {
      phone,
    }
    app.client.request(
      undefined,
      'api/users',
      'GET',
      queryStringObject,
      undefined,
      function(statusCode, responsePayload) {
        if (statusCode === 200) {
          var allChecks =
            typeof responsePayload.checks === 'object'
              ? responsePayload.checks
              : false

          if (allChecks.length > 0) {
            allChecks.forEach(function(checkId) {
              var newQueryStringObject = {
                id: checkId,
              }
              app.client.request(
                undefined,
                'api/checks',
                'GET',
                newQueryStringObject,
                undefined,
                function(statusCode, responsePayload) {
                  if (statusCode === 200) {
                    var checkData = responsePayload

                    var table = document.getElementById('checksListTable')
                    var tr = table.insertRow(-1)
                    tr.classList.add('checkRow')
                    var td0 = tr.insertCell(0)
                    var td1 = tr.insertCell(1)
                    var td2 = tr.insertCell(2)
                    var td3 = tr.insertCell(3)
                    var td4 = tr.insertCell(4)

                    td0.innerHTML = responsePayload.method.toUpperCase()
                    td1.innerHTML = responsePayload.protocol + '://'
                    td2.innerHTML = responsePayload.url
                    var state =
                      typeof responsePayload.state === 'string'
                        ? responsePayload.state
                        : ''
                    td3.innerHTML = state
                    td4.innerHTML =
                      '<a href="checks/edit?id=' +
                      responsePayload.id +
                      '">View</a> / <a href="checks/edit?id=' +
                      responsePayload.id +
                      '">Edit</a> / <a href="checks/edit?id=' +
                      responsePayload.id +
                      '">Delete</a>'
                  } else {
                    console.log('Error trying to load check ID: ', checkId)
                  }
                }
              )
            })

            if (allChecks.length < 5) {
              document.getElementById('createCheckCTA').style.display = 'block'
            }
          } else {
            document.getElementById('noChecksMessage').style.display =
              'table-row'
            document.getElementById('createCheckCTA').style.display = 'block'
          }
        } else {
          app.logUserOut()
        }
      }
    )
  } else {
    app.logUserOut()
  }
}

app.loadChecksEditPage = function() {
  var id =
    typeof window.location.href.split('=')[1] === 'string' &&
    window.location.href.trim().length > 0
      ? window.location.href.split('=')[1].trim()
      : false
  console.log('Checks edit: ', id)
  if (id) {
    var queryStringObject = { id }

    app.client.request(
      undefined,
      'api/checks',
      'GET',
      queryStringObject,
      undefined,
      function(statusCode, responsePayload) {
        if (statusCode === 200) {
          var hiddenInputs = document.querySelectorAll('input.hiddenInput')
          for (var i = 0; i < hiddenInputs.length; i++) {
            hiddenInputs[i].value = responsePayload.id
          }

          document.querySelector('#checksEdit1 .displayIdInput').value =
            responsePayload.id
          document.querySelector('#checksEdit1 .displayStateInput').value =
            responsePayload.state
          document.querySelector('#checksEdit1 .protocolInput').value =
            responsePayload.protocol
          document.querySelector('#checksEdit1 .urlInput').value =
            responsePayload.url
          document.querySelector('#checksEdit1 [name=httpmethod]').value =
            responsePayload.method
          document.querySelector('#checksEdit1 [name=timeoutSeconds]').value =
            responsePayload.timeoutSeconds

          var successCodeCheckboxes = document.querySelectorAll(
            '#checksEdit1 input[name=successCodes]'
          )

          for (var i = 0; i < successCodeCheckboxes.length; i++) {
            if (
              responsePayload.successCodes.indexOf(
                successCodeCheckboxes[i].value
              ) > -1
            ) {
              successCodeCheckboxes[i].checked = true
            }
          }
        } else {
          window.location = '/checks/all'
        }
      }
    )
  } else {
    window.location = '/checks/all'
  }
}

app.tokenRenewalLoop = function() {
  setInterval(function() {
    app.renewToken(function(err) {
      if (!err) {
        console.log('Token renewed successfully @' + Date.now())
      }
    })
  }, 1000 * 60)
}

// Init (bootstrapping)
app.init = function() {
  // Bind all form submissions
  app.bindForms()

  app.bindLogoutButton()

  app.getSessionToken()

  app.tokenRenewalLoop()

  app.loadDataOnPage()
}

// Call the init processes after the window loads
window.onload = function() {
  app.init()
}
