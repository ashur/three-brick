const authenticate = require( '../middleware/authenticate' );
const bodyParser = require( 'body-parser' );
const express = require( 'express' );
const FileSync = require( 'lowdb/adapters/FileSync' );
const low = require( 'lowdb' );
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
 * Single palette endpoints
 *
 * - GET
 * - PUT
 * - DELETE
 */

let palette;

router.param( 'id', (request, response, next, id)=>
{
	palette = db.get( 'palettes' )
		.find({ id: request.params.id })
		.value();

	if( palette === undefined )
	{
		response.status( 404 )
			.json( { error: 'Palette not found' } );
	}
	else
	{
		next();
	}
});

/**
 * GET /api/palettes/:id
 */
router.get( '/:id', (request, response) =>
{
	response.json( palette );
});

/**
 * PUT /api/palettes/:id
 */
router.put( '/:id', authenticate, (request, response) =>
{
	let newProperties = {};
	let writableProperties = ['name', 'foreground', 'middle', 'background', 'skipUntil'];

	writableProperties.forEach( property =>
	{
		if( request.body[property] )
		{
			newProperties[property] = request.body[property];
		}
	});

	let updatedPalette = db.get( 'palettes' )
		.find( { id: palette.id } )
		.assign( newProperties )
		.write();

	response.send( updatedPalette );
});

/**
 * GET /api/palettes/:id
 */
router.delete( '/:id', authenticate, (request, response) =>
{
	db.get( 'palettes' )
		.remove({ id: palette.id })
		.write();

	response.json( palette );
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
