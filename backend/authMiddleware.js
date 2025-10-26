const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    let token;
    // 1. Check for token in the Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    // 2. If not found, check for token in query parameters (for images)
    else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (token == null) {
        return res.sendStatus(401); 
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); 
        }
        req.user = user;
        next();
    });
};

module.exports = authMiddleware;