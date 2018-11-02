const JWT = require ('jsonwebtoken');
const Configuration = require ('../../config.json');

class WebTokenMiddleware {

    static WebToken (req, res, next) {
        if (!(typeof Configuration.authentification.enabled === "undefined" ? true : Configuration.authentification.enabled))
            return next ();

        try {
            let tokenResult = JWT.verify (
                req.header ("Web-Token"),
                (typeof Configuration.authentification.secret === "undefined" ? "test" : Configuration.authentification.secret),
                {
                    algorithms: typeof Configuration.authentification.webToken.algorithms === "undefined" ? ["HS512"] : Configuration.authentification.webToken.algorithms,
                    audience: typeof Configuration.authentification.webToken.audience === "undefined" ? undefined : Configuration.authentification.webToken.audience,
                    ignoreExpiration: typeof Configuration.authentification.webToken.ignoreExpiration === "undefined" ? true : Configuration.authentification.webToken.ignoreExpiration,
                }
            );

            let webTokenReceivers = typeof Configuration.authentification.webToken.receivers === "undefined" ? [""] : Configuration.authentification.webToken.receivers;
            if (typeof tokenResult.receiver !== 'string' || !webTokenReceivers.includes (tokenResult.receiver))
                return res.status(401).send();

            return next ();
        } catch (e) {
            return res.status(401).send(e.message);
        }
    }

}

module.exports = WebTokenMiddleware;