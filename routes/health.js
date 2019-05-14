const express = require( 'express' );
const router = express.Router();

/**
 * /api/health
 */
router.get( '/', (request, response) =>
{
	response.set( 'Access-Control-Allow-Origin', '*' );
	response.json( { status: "OK" } )
});

module.exports = router;
