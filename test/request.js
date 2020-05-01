const test = require('ava')
const sinon = require('sinon')
const Request = require('../lib/request')

// setup & fixture data
const siteId = 123
const apiKey = 'abc'
const uri = 'https://track.customer.io/api/v1/customers/1'
const data = { first_name: 'Bruce', last_name: 'Wayne' }
const auth = `Basic ${Buffer.from(`${siteId}:${apiKey}`).toString('base64')}`
const baseOptions = {
  uri,
  headers: {
    Authorization: auth,
    'Content-Type': 'application/json'
  }
}

test.beforeEach(t => {
  t.context.req = new Request(123, 'abc', { timeout: 5000 })
})

// tests begin here
test('constructor sets all properties correctly', t => {
  t.is(t.context.req.siteid, 123)
  t.is(t.context.req.apikey, 'abc')
  t.deepEqual(t.context.req.defaults, { timeout: 5000 })
  t.is(t.context.req.auth, auth)
})

test('constructor sets default timeout correctly', t => {
  const req = new Request()
  t.deepEqual(req.defaults, { timeout: 10000 })
})

test('#options returns a correctly formatted object', t => {
  const expectedOptions = Object.assign(baseOptions, { method: 'POST' })
  const resultOptions = t.context.req.options(uri, 'POST')

  t.deepEqual(resultOptions, expectedOptions)
})

const getOptions = Object.assign({}, baseOptions, {
  method: 'GET',
  qs: data
})

test('#get calls the handler, makes GET request with the correct args', t => {
  sinon.stub(t.context.req, 'handler')
  t.context.req.get(uri, data)
  t.truthy(t.context.req.handler.calledWith(getOptions))
})

const putOptions = Object.assign({}, baseOptions, {
  method: 'PUT',
  body: JSON.stringify(data)
})

test('#handler returns a promise', t => {
  const promise = t.context.req.handler(putOptions)
  t.context.req._request = () => {}
  t.is(promise.constructor.name, 'Promise')
})

test('#handler makes a request and resolves a promise on success', t => {
  const body = {}
  t.context.req._request = (options, cb) => {
    cb(null, { statusCode: 200 }, JSON.stringify(body))
  }
  return t.context.req.handler(putOptions).then(res => t.deepEqual(res, body))
})

test('#handler makes a request and rejects with an error on failure', t => {
  const customOptions = Object.assign({}, baseOptions, {
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' })
  })

  const message = 'test error message'
  const body = { meta: { error: message } }

  t.context.req._request = (options, cb) => {
    cb(null, { statusCode: 400 }, JSON.stringify(body))
  }

  return t.context.req
    .handler(customOptions)
    .catch(err => t.is(err.message, message))
})

test('#handler makes a request and rejects with `null` as body', t => {
  const customOptions = Object.assign({}, baseOptions, {
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' })
  })

  t.context.req._request = (options, cb) => {
    cb(null, { statusCode: 500 })
  }

  return t.context.req
    .handler(customOptions)
    .catch(err => t.is(err.message, 'Unknown error'))
})

test('#handler makes a request and rejects with timeout error', t => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
    timeout: 1
  })

  const message = 'test error message'
  const body = { meta: { error: message } }

  return t.context.req
    .handler(customOptions)
    .then(t.fail)
    .catch(err => t.is(err.message, 'ETIMEDOUT'))
})

test('#put calls the handler, makes PUT request with the correct args', t => {
  sinon.stub(t.context.req, 'handler')
  t.context.req.put(uri, data)
  t.truthy(t.context.req.handler.calledWith(putOptions))
})

test('#put returns the promise generated by the handler', t => {
  const promise = t.context.req.put(uri, data)
  t.is(promise.constructor.name, 'Promise')
})

const deleteOptions = Object.assign({}, baseOptions, { method: 'DELETE' })

test('#destroy calls the handler, makes a DELETE request with the correct args', t => {
  sinon.stub(t.context.req, 'handler')
  t.context.req.destroy(uri)
  t.truthy(t.context.req.handler.calledWith(deleteOptions))
})

test('#destroy returns the promise generated by the handler', t => {
  const promise = t.context.req.destroy(uri)
  t.is(promise.constructor.name, 'Promise')
})

const postOptions = Object.assign({}, baseOptions, {
  method: 'POST',
  body: JSON.stringify(data)
})

test('#post calls the handler, makes a POST request with the correct args', t => {
  sinon.stub(t.context.req, 'handler')
  t.context.req.post(uri, data)
  t.truthy(t.context.req.handler.calledWith(postOptions))
})

test('#post returns the promise generated by the handler', t => {
  const promise = t.context.req.post(uri)
  t.is(promise.constructor.name, 'Promise')
})
