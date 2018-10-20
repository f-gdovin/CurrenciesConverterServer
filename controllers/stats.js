const getTopCurrencies = (db) => (req, res) => {
    const { limit = 10 } = req.body;
    db.select('*').from('rank').orderBy('total_times_used', 'desc').limit(limit)
        .then(rank => normalizeRank(rank))
        .then(normalizedRank => res.json(normalizedRank))
        .catch(err => res.status(500).json(`Error fetching data. Reason: ${err}`))
};

const getUsage = (db) => (req, res) => {
    return db.select('*').from('usage')
        .then(usage => {
            if (usage && Array.isArray(usage) && usage.length > 0) {
                res.json({
                    totalAmountConverted: usage[0].total_amount_converted,
                    totalRequestsMade: usage[0].total_requests_made
                })
            } else {
                res.status(404).json('Not found');
            }
        })
        .catch(err => res.status(500).json(`Error fetching data. Reason: ${err}`))
};

const normalizeRank = (rank) => {
    let rankObject = {};
    if (rank && Array.isArray(rank) && rank.length > 0) {
        rank.forEach(currencyRank =>
            rankObject[currencyRank.currency_code] = currencyRank.total_times_used);
    }
    return Promise.resolve(rankObject);
};

module.exports = {
    getTopCurrencies, getUsage
};