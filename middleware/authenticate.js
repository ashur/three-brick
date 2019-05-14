/*
 * Perform amateur-hour authentication for data manipulation requests 🤪
 */
module.exports = (request, response, next) =>
{
	if( request.get( 'API-Token' ) != process.env.API_TOKEN )
	{
		response.status( 401 )
			.json( { error: "Missing or invalid API token" } );
	}
	else
	{
		next();
	}
}
