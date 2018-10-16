const testHeartbeat = (db) => (req, res) => {
    db.raw('select 1 as dbIsUp')
        .then(res.status(200).json('Database is alive, server ready'))
        .catch(() => res.status(500).json('Error contacting database'))
};

module.exports = {
    testHeartbeat
};