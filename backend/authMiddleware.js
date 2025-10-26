const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get the token from the Authorization header (e.g., "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // If there's no token, the user is unauthorized
        return res.sendStatus(401); 
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // If the token is invalid or expired
            return res.sendStatus(403); 
        }

        // If the token is valid, the 'user' payload is attached to the request object
        // Now, downstream routes can access req.user.tenantId, req.user.userId, etc.
        req.user = user;
        next(); // Proceed to the next middleware or the route handler
    });
};

module.exports = authMiddleware;