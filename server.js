require('dotenv').config();
const express = require('express');

const port = process.env.PORT || 3001;

// middlewares
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const knex = require('knex');

const heartbeat = require('./controllers/heartbeat');
const currencies = require('./controllers/currencies');
const stats = require('./controllers/stats');

const db = knex({
    client: 'pg',
    connection: process.env.POSTGRES_URI
});

const whitelist = [process.env.UI_URL];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error(`${origin} is not allowed by CORS`))
        }
    }
};

const app = express();

app.use(morgan('combined'));
app.use(cors(corsOptions));
app.use(bodyParser.json());

// just a heartbeat test
app.get('/', heartbeat.testHeartbeat(db));

// public routes
app.get('/currencies/list', currencies.getCurrencies);
app.post('/currencies/convert', currencies.convert(db));

app.post('/stats/top', stats.getTopCurrencies(db));
app.get('/stats/usage', stats.getUsage(db));

app.listen(port, () => {
    console.log(`CurrenciesConverter server running at ${port}`)
});