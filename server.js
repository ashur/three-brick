const dotenv = require( 'dotenv' );
const express = require('express');
const app = express();

dotenv.config();

app.use( '/api/health', require( './routes/health' ) );
app.use( '/api/palettes', require( './routes/palettes' ) );
app.use( express.static( 'public' ) );

app.get( '/', (request, response) =>
{
	response.sendFile( __dirname + '/views/index.html' );
});

let listener = app.listen( process.env.PORT, () =>
{
	console.log( 'Express listening on port:', process.env.PORT );
});
