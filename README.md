# 📚 Books API

A simple books api service

## Prepare your project for production

Set your Node.js environment to production in `package.json`

```json
"start": "NODE_ENV=production node server.js"
```

Set your `port` number to refer to `process.env.PORT` when `process.env.NODE_ENV` is in `production`.

```js
const port = process.env.NODE_ENV === "production" ? process.env.PORT : 8080;
```

## Deploy to Heroku

See [instructions](https://devcenter.heroku.com/articles/heroku-cli) to deploy your project to Heroku with Heroku CLI.
