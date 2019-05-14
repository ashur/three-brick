class Palette
{
	constructor( {name, foreground, middle, background, enabled=true} = {} )
	{
		this.name = name;
		this.foreground = foreground;
		this.middle = middle;
		this.background = background;
		this.enabled = enabled;
	}

	get id()
	{
		return this.colors.join( '.' );
	}
}

module.exports = Palette;
