const fetch = require('node-fetch');
const util = require('util');

const exchangeRateLatestUrl = 'https://api.exchangeratesapi.io/latest';
const openExchangeRatesCurrenciesUrl = `https://openexchangerates.org/api/currencies.json`;

// uses https://exchangeratesapi.io/ to get supported currencies
// and maps codes to names using https://openexchangerates.org/api/currencies.jsonhttps://openexchangerates.org/api/currencies.json
const getCurrencies = (req, res) => {
    getCurrencyCodes()
        .then(currencyCodes => getCurrencyCodeNameMap(currencyCodes))
        .then(codeNameMap => res.json(codeNameMap))
        .catch(err => res.status(400).json(`Unable to handle 'list currencies' API call. Reason: ${err}`));
};

// uses https://exchangeratesapi.io/
const convert = (db) => (req, res) => {
    const { from, to, amount } = req.body;
    doConvert(from, to, amount)
        .then(rate => res.json(amount * rate))
        .catch(err => res.status(400).json(`Unable to handle 'convert money' API call. Reason: ${err}`));

    // update database (total amount converted in USD, total number of requests, most popular target currency
    // NOTE: if the original 'from' currency was NOT in USD, we need to convert it
    if (from !== 'USD') {
        console.log('Original conversion was NOT from USD, fake it in order to update DB...');
        doConvert(from, 'USD', amount)
            .then(rate => amount * rate)
            .then(usdAmount => updateTopCurrencies(db, usdAmount, to))
            .then(() => console.log('DB updated successfully'))
            .catch(err => console.log(`Unable to update DB. Reason: ${err}`))
    } else {
        updateTopCurrencies(db, amount, to)
            .then(() => console.log('DB updated successfully'))
            .catch(err => console.log(`Unable to update DB. Reason: ${err}`))
    }
};

const doConvert = (from, to, amount) => {
    return new Promise((resolve, reject) => {
        if (!from || !to || !amount || Number.isNaN(amount) || amount <= 0) {
            return reject(`Unable to initiate 'convert money' API call. Reason: Invalid input`);
        }
        const url = `${exchangeRateLatestUrl}?base=${from}&symbols=${to}`;
        fetch(url)
            .then(response => response.json())
            .then(body => getRateOrFail(body, to))
            .then(rate => resolve(rate))
            .catch(err => reject(err));
    });
};

const getCurrencyCodes = () => {
    return new Promise((resolve, reject) => {
        fetch(`${exchangeRateLatestUrl}?base=EUR`)
            .then(response => response.json())
            .then(body => getCurrencyCodesOrFail(body))
            .then(currencies => resolve(currencies))
            .catch(err => reject(err));
    });
};

const getCurrencyCodesOrFail = (apiResponse) => {
    if (apiResponse.rates) {
        const baseCurrency = { EUR : 1 };   // don't forget to add initial currency to the list
        return Promise.resolve(Object.assign({}, apiResponse.rates, baseCurrency));
    } else {
        return Promise.reject('Failed to fetch currency codes');
    }
};

const getCurrencyCodeNameMap = (currencyCodes) => {
    return new Promise((resolve, reject) => {
        fetch(openExchangeRatesCurrenciesUrl)
            .then(response => response.json())
            .then(codeNames => mergeCodeNames(currencyCodes, codeNames))
            .then(codeNameMap => resolve(codeNameMap))
            .catch(err => reject(err));
    });
};

const getRateOrFail = (apiResponse, to) => {
    if (apiResponse.rates && apiResponse.rates[to] && typeof apiResponse.rates[to] === "number" && Number.isFinite(apiResponse.rates[to])) {
        return Promise.resolve(apiResponse.rates[to]);
    } else {
        return Promise.reject('Failed to fetch exchange rate');
    }
};

const mergeCodeNames = (currencyCodes, codeNames) => {
    return new Promise((resolve, reject) => {
        const codeNameMap = {};
        Object.keys(currencyCodes).sort().forEach(code => {
            const name = codeNames[code];
            if (name) {
                codeNameMap[code] =  name;
            } else {
                return reject(`Fetching of currency codes and names failed. Unknown currency code: ${code}`);
            }
        });
        return resolve(codeNameMap);
    });

};

const updateTopCurrencies = async (db, amount, to) => {
    return new Promise((resolve, reject) => {
        // statements to upsert 'rank' table
        console.log(`Incrementing use count for currency code ${to}...`);
        const insert = db.insert({ currency_code : to, total_times_used : 1 }).into('rank');
        const update = db('rank').where('rank.currency_code', '=', to).increment('rank.total_times_used', 1);

        const query = util.format(
            '%s ON CONFLICT (currency_code) DO UPDATE SET %s',
            insert.toString(),
            update.toString().replace(/^update\s.*\sset\s"rank"\./i, '')    // remove extra syntax which would break ON CONFLICT expression
        );

        db.transaction(trx => {
            trx.raw(query)
                .then(() => {
                    console.log(`Incremented use count for currency code ${to} successfully`);
                    console.log('Incrementing total amount converted...');
                    return trx('usage')
                        .increment('total_amount_converted', amount)
                        .then(console.log('Incremented total amount converted successfully'));
                })
                .then(() => {
                    console.log(`Incremented use count for currency code ${to} successfully`);
                    console.log('Incrementing total requests made...');
                    return trx('usage')
                        .increment('total_requests_made', 1)
                        .then(console.log('Incremented total requests made successfully'));
                })
                .then(trx.commit)
                .then(resolve)
                .catch(trx.rollback)
        })
            .catch((err) => reject(`Unable to update database record. Reason: ${err}`));
    });

};

module.exports = {
    getCurrencies,
    convert
};