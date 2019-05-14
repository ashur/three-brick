const authenticate = require( '../middleware/authenticate' );
const bodyParser = require( 'body-parser' );
const express = require( 'express' );
const FileSync = require( 'lowdb/adapters/FileSync' );
const low = require( 'lowdb' );
const Palette = require( '../src/palette' );
const router = express.Router();
const shortid = require( 'shortid' );

const adapter = new FileSync( '.data/palettes.json' );
let db = low( adapter );

let dbDefaults = {
	palettes: [],
};

db.defaults( dbDefaults )
	.write();

router.use( bodyParser.json() ); // support json encoded bodies
router.use( bodyParser.urlencoded( { extended: true } ) ); // support encoded bodies

/**
 * GET /api/palettes
 */
router.get( '/', (request, response) =>
{
	let palettes = db.get( 'palettes' )
		.value();

	response.json( palettes );
});

/**
 * GET /api/palettes/random
 *
 * This endpoint is authenticated because it causes a write.
 */
router.get( '/random', authenticate, (request, response) =>
{
	let filterSkipped = palette =>
	{
		return palette.skipUntil < Date.now();
	};

	let randomPalette = getRandomPalette( filterSkipped );
	if( randomPalette === undefined )
	{
		db.get( 'palettes' )
			.value()
			.forEach( palette =>
			{
				db.get( 'palettes' )
					.find( { id: palette.id } )
					.assign( { skipUntil: 0 } )
					.write();
			});

		randomPalette = getRandomPalette();
	}

	let skipUntil = Date.now() + (60 * 60 * 24 * 7);
	db.get( 'palettes' )
		.find( { id: randomPalette.id } )
		.assign( { skipUntil: skipUntil } )
		.write();

	response.json( randomPalette );
});

/**
 * GET /api/palettes/:id
 */
router.get( '/:id', (request, response) =>
{
	let palette = db.get( 'palettes' )
		.find({ id: request.params.id })
		.value();

	if( palette !== undefined )
	{
		response.json( palette );
	}
	else
	{
		response
			.status( 404 )
			.json( { error: 'Palette not found' } );		
	}
});

/**
 * GET /api/palettes/:id
 */
router.delete( '/:id', authenticate, (request, response) =>
{
	let result = db.get( 'palettes' )
		.remove({ id: request.params.id })
		.write();

	if( result.length > 0 )
	{
		response.json( result );
	}
	else
	{
		response
			.status( 404 )
			.json( { error: 'Palette not found' } );
	}
});

/**
 * POST /api/palettes
 */
router.post( '/', authenticate, (request, response) =>
{
	try
	{
		['name', 'foreground', 'middle', 'background'].forEach( requiredParam =>
		{
			if( request.body[requiredParam] === undefined || request.body[requiredParam] === null )
			{
				throw new Error( `Missing required parameter '${requiredParam}'` );
			}
		});

		let newPalette = {
			id: shortid.generate(),
			name: request.body.name,
			foreground: request.body.foreground,
			middle: request.body.middle,
			background: request.body.background,
			skipUntil: 0,
		};

		db.get( 'palettes' )
			.push( newPalette )
			.write();

		response.send( newPalette );
	}
	catch( error )
	{
		console.log( error );
		response.json( { error: error.message } );
	}
});

/**
 * @param [{Function}]
 */
function getRandomPalette( filter )
{
	return db.get( 'palettes' )
		.filter( filter )
		.sample()
		.value();
}

module.exports = router;
