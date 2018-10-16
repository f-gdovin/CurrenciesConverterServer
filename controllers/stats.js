const getTopCurrencies = (db) => (req, res) => {
    const { limit = 10 } = req.body;
    db.select('*').from('rank').orderBy('total_times_used', 'desc').limit(limit)
        .then(rank => {
            if (rank.length) {
                res.json(rank)
            } else {
                res.status(404).json('Not found');
            }
        })
        .catch(err => res.status(500).json(`Error fetching data. Reason: ${err}`))
};

const getUsage = (db) => (req, res) => {
    db.select('*').from('usage')
        .then(usage => {
            if (usage.length) {
                res.json(usage)
            } else {
                res.status(404).json('Not found');
            }
        })
        .catch(err => res.status(500).json(`Error fetching data. Reason: ${err}`))
};

module.exports = {
    getTopCurrencies, getUsage
};