var game;
var gameOptions = {

    // width of the game, in pixels
    gameWidth: 640,

    // height of the game, in pixels
    gameHeight: 480,

    // background color
    bgColor: 0x444444,

    // player gravity
    playerGravity: 900,

    // player horizontal speed
    playerSpeed: 300,

    // player force
    playerJump: 300,

    playerWallDragMaxVelocity: 50,

    // allow how many jumps (>1 for mid air jumps)
    playerMaxJumps: 1,

    // should be below acceleration. Disabling "slippery floor" for now by giving ridiculously high value
    playerDrag: 12050,// 1250,

    playerAcceleration: 1500
}
window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("PreloadGame", preloadGame);
    game.state.add("PlayGame", playGame);
    game.state.start("PreloadGame");
}
var preloadGame = function(game){}
preloadGame.prototype = {
    preload: function(){
        game.stage.backgroundColor = gameOptions.bgColor;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;

        // loading level tilemap
        game.load.tilemap("level", 'level.json', null, Phaser.Tilemap.TILED_JSON);
        game.load.image("tile", "tile.png");
        game.load.image("hero", "hero.png");
    },
    create: function(){
        game.state.start("PlayGame");
    }
}
var playGame = function(game){}
playGame.prototype = {
    create: function(){

        // starting ARCADE physics
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // creatin of "level" tilemap
        this.map = game.add.tilemap("level");

        // adding tiles (actually one tile) to tilemap
        this.map.addTilesetImage("tileset01", "tile");

        // tile 1 (the black tile) has the collision enabled
        this.map.setCollision(1);

        // which layer should we render? That's right, "layer01"
        this.layer = this.map.createLayer("layer01");

        // adding the hero sprite
        this.hero = game.add.sprite(game.width / 2, 440, "hero");

        // setting hero anchor point
        this.hero.anchor.set(0.5);

        // enabling ARCADE physics for the  hero
        game.physics.enable(this.hero, Phaser.Physics.ARCADE);

        // setting hero gravity
        this.hero.body.gravity.y = gameOptions.playerGravity;

        // setting hero horizontal speed
        //this.hero.body.velocity.x = gameOptions.playerSpeed;

        // Set player minimum and maximum movement speed
	    this.hero.body.maxVelocity.setTo(gameOptions.playerSpeed, gameOptions.playerSpeed * 10); // x, y

	    // Add drag to the player that slows them down when they are not accelerating
	    this.hero.body.drag.setTo(gameOptions.playerDrag,  0); // x, y

        // the hero can jump
        this.canJump = true;

        // hero is in a jump
        this.jumping = false;

        // the hero is not on the wall
        this.onWall = false;

        // waiting for player input
       // game.input.onDown.add(this.handleJump, this);
        cursors = game.input.keyboard.createCursorKeys();
    	jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    	//jumpButton.onDown(this.handleJump, this)
    },
    handleJump: function(){

        // the hero can jump when:
        // canJump is true AND the hero is on the ground (blocked.down)
        // OR
        // the hero is on the wall
        if((this.canJump ) || this.onWall){

            // applying jump force
            this.hero.body.velocity.y = -gameOptions.playerJump;

            // is the hero on a wall?
            //console.log(this.firstJump)
            if(this.onWall && !this.isFirstJump){

                // flip horizontally the hero
                this.hero.scale.x *= -1;

                // change the horizontal velocity too. This way the hero will jump off the wall
                this.hero.body.velocity.x = gameOptions.playerSpeed * this.hero.scale.x;
            }

            // hero can't jump anymore
            //this.canJump = false;

            // hero is not on the wall anymore
            this.onWall = false;
        }
    },
    update: function(){

        // handling collision between the hero and the tiles
        game.physics.arcade.collide(this.hero, this.layer, function(hero, layer){


            // hero on the ground
            if(hero.body.blocked.down){

                // hero can jump
                this.canJump = true;

                // hero not on the wall
                this.onWall = false;

                
            }
            

            // hero on the ground and touching a wall on the right
            if(this.hero.body.blocked.right && this.hero.body.blocked.down){

                // horizontal flipping hero sprite
                //this.hero.scale.x = -1;
                //this.isSlidingOnWall = false;
            }

            // hero NOT on the ground and touching a wall on the right
            if(this.hero.body.blocked.right && !this.hero.body.blocked.down){

                // hero on a wall
                this.onWall = true;

                // drag on wall only if key pressed and going downwards.
                if (this.rightInputIsActive() && this.hero.body.velocity.y>gameOptions.playerWallDragMaxVelocity){
                	this.hero.body.velocity.y = gameOptions.playerWallDragMaxVelocity;
                }

                // is sliding/going up on wall
                if (this.rightInputIsActive()){
                    this.isSlidingOnWall = true;
                }
            }

            // same concept applies to the left
            if(this.hero.body.blocked.left && this.hero.body.blocked.down){
                //this.hero.scale.x = 1;
                this.isSlidingOnWall = false;
            }
            if(this.hero.body.blocked.left && !this.hero.body.blocked.down){
                this.onWall = true;

                // drag on wall only if key pressed and going downwards.
                if (this.leftInputIsActive() && this.hero.body.velocity.y>gameOptions.playerWallDragMaxVelocity){
                	this.hero.body.velocity.y = gameOptions.playerWallDragMaxVelocity;
                }

                // is sliding/going up on wall
                if (this.leftInputIsActive()){
                    this.isSlidingOnWall = true;
                }
            }

            // adjusting hero speed according to the direction it's moving
            //this.hero.body.velocity.x = gameOptions.playerSpeed * this.hero.scale.x;
        }, null, this);

        if (this.hero.body.blocked.down || this.onWall){
            // set total jumps allowed
            this.jumps = gameOptions.playerMaxJumps;
            this.jumping = false;
        }
        else if(!this.jumping){
            this.jumps = 0;
        }

        if (this.leftInputIsActive()) {
	        // If the LEFT key is down, set the player velocity to move left
	        this.hero.body.acceleration.x = -gameOptions.playerAcceleration;
	        this.hero.scale.x = -1;
	    } else if (this.rightInputIsActive()) {
	        // If the RIGHT key is down, set the player velocity to move right
	        this.hero.body.acceleration.x = gameOptions.playerAcceleration;
	        this.hero.scale.x = 1;
	    } else {
	        this.hero.body.acceleration.x = 0;
	    }

	    if ((this.onWall || this.jumps > 0) && this.spaceInputIsActive(150)){
            if (this.hero.body.blocked.down)
                this.isFirstJump = true;
    		this.handleJump()
            this.jumping = true;

            
    		//this.hero.body.velocity.y = -gameOptions.playerJump;
    	}
        if (this.spaceInputReleased()){
            this.isFirstJump = false;
        }
        if (this.jumping && this.spaceInputReleased()) {
            this.jumps--;
            this.jumping = false;
        }
    },
    spaceInputIsActive: function(duration) {
	    var isActive = false;

	    isActive = this.input.keyboard.downDuration(Phaser.Keyboard.SPACEBAR, duration);
	    return isActive;
	},
    spaceInputReleased: function() {
        var released = false;

        released = this.input.keyboard.upDuration(Phaser.Keyboard.SPACEBAR);

        return released;
    },
    rightInputIsActive: function() {
	    var isActive = false;

	    isActive = this.input.keyboard.isDown(Phaser.Keyboard.RIGHT);
	    return isActive;
	},
    leftInputIsActive: function(duration) {
	    var isActive = false;

	    isActive = this.input.keyboard.isDown(Phaser.Keyboard.LEFT);
	    return isActive;
	}

}
