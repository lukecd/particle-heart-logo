window.addEventListener("load", function () {
	const canvas = document.getElementById("canvas2");
	const ctx = canvas.getContext("2d");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	let mode = "random"; // random, heart, logo, falling, offscreen

	class Particle {
		constructor(x, y, size, effect) {
			this.x = Math.random() * canvas.width;
			this.y = Math.random() * canvas.height;
			this.effect = effect;
			// our initial position is the heart shape
			this.heartX = Math.floor(x);
			this.heartY = Math.floor(y);

			// set initial position the same, but it will be changed later
			this.logoX = this.heartX;
			this.logoY = this.heartY;

			// pick an offscreen coordinate
			const offscreenDirection = randomInt(1, 4); //1 top, 2 right, 3 bottom, 4 left
			this.offscreenX = 0;
			this.offscreenY = 0;
			if (offscreenDirection === 1) {
				this.offscreenX = this.heartX;
				this.offscreenY = -10;
			} else if (offscreenDirection === 2) {
				this.offscreenX = canvas.width + 10;
				this.offscreenY = this.heartY;
			} else if (offscreenDirection === 3) {
				this.offscreenX = this.heartX;
				this.offscreenY = canvas.height + 10;
			} else if (offscreenDirection === 2) {
				this.offscreenX = -10;
				this.offscreenY = this.heartY;
			}

			this.destinationX = this.heartX;
			this.destinationY = this.heartY;

			this.size = size;
			this.vx = randomFloat(-1, 1);
			this.vy = randomFloat(-1, 1);

			// pick a random color from our palette
			this.colors = ["#FF8451", "#FFC46C", "#EDE8DB", "#D3D9EF", "#DBDEE9"];
			this.color = this.colors[randomInt(0, this.colors.length - 1)];

			this.easeX = Math.random() * 0.1;
			this.easeY = Math.random() * 0.1;

			// random number for normal movement, makes each particle move at a different speed
			this.directionX = Math.random() / 2;
			this.directionY = Math.random() / 2;
			// half of the time go negative
			if (Math.random() > 0.5) this.directionX = -this.directionX;
			if (Math.random() > 0.5) this.directionY = -this.directionY;

			// should we be a circle or a square
			const shapeDecider = Math.random();
			if (shapeDecider > 0.5) this.shape = "CIRCLE";
			else this.shape = "SQUARE";

			// squares get rotated, don't bother doing it to a circle as nobody would notice :)
			this.degree = 0;
		}

		draw(ctx) {
			if (this.shape === "CIRCLE") {
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
				ctx.fillStyle = this.color;
				ctx.fill();
			} else {
				ctx.save();
				ctx.translate(this.x - this.size, this.y - this.size);
				ctx.rotate((this.degree * Math.PI) / 180);
				this.degree += Math.random();
				ctx.fillStyle = this.color;
				ctx.fillRect(0, 0, this.size * 2, this.size * 2);
				ctx.restore();
			}
			ctx.fillStyle = this.color;
			ctx.fillRect(this.x, this.y, this.size, this.size);
		}

		update() {
			// check edges, but not for offscreen mode
			if (mode !== "offscreen") {
				if (this.x > canvas.width || this.x < 0) {
					this.directionX = -this.directionX;
				}
				if (this.y > canvas.height || this.y < 0) {
					this.directionY = -this.directionY;
				}
			}

			if (mode === "random") {
				this.x += this.directionX;
				this.y += this.directionY;
			} else if (mode === "heart") {
				this.x += (this.heartX - this.x) * this.easeX;
				this.y += (this.heartY - this.y) * this.easeY;
			} else if (mode === "logo") {
				this.x += (this.logoX - this.x) * this.easeX;
				this.y += (this.logoY - this.y) * this.easeY;
			} else if (mode === "falling") {
				this.y += Math.abs(this.directionY);
			} else if (mode === "offscreen") {
				this.x += (this.offscreenX - this.x) * this.easeX;
				this.y += (this.offscreenY - this.y) * this.easeY;
			}
		}

		setLogoXY(x, y) {
			this.logoX = x;
			this.logoY = y;
		}

		swapDestination() {
			if (this.destinationX === this.heartX) {
				this.destinationX = this.logoX;
				this.destinationY = this.logoY;
			} else {
				this.destinationX = this.heartX;
				this.destinationY = this.heartY;
			}
		}
	}

	class Effect {
		constructor(width, height, ctx) {
			this.heartImage = document.getElementById("heart");
			this.logoImage = document.getElementById("logo");
			console.log(this.logoImage);
			this.width = width;
			this.height = height;
			this.centerX = this.width / 2;
			this.centerY = this.height / 2;
			this.x = this.centerX - this.heartImage.width / 2;
			this.y = this.centerY - this.heartImage.height / 2;
			this.ctx = ctx;
			this.particlesArray = [];
			this.gap = 10;
			this.mouse = {
				radius: 3000,
				x: undefined,
				y: undefined,
			};

			window.addEventListener("mousemove", (event) => {
				this.mouse.x = event.x;
				this.mouse.y = event.y;
			});
		}

		init() {
			// images need to be square, so figure out current size and pick the smaller
			// to make into image dimensions
			let imageWidth = this.width;
			let imageHeight = this.height;
			let imageX = 0;
			let imageY = 0;

			if (this.width > this.height) {
				imageX = (this.width - this.height) / 2;
			} else if (this.height > this.width) {
				imageY = (this.height - this.width) / 2;
			}
			if (imageWidth < imageHeight) imageHeight = imageWidth;
			else if (imageHeight < imageWidth) imageWidth = imageHeight;

			this.ctx.drawImage(this.heartImage, imageX, imageY, imageWidth, imageHeight);
			const heartPixels = this.ctx.getImageData(0, 0, this.width, this.height).data;
			for (let y = 0; y < this.height; y += this.gap) {
				for (let x = 0; x < this.width; x += this.gap) {
					const index = (y * this.width + x) * 4; // 4 because r, g, b, a have separate array positions

					const alpha = heartPixels[index + 3];
					if (alpha > 0) {
						let size = Math.floor(
							Math.sqrt(
								Math.pow(canvas.width / 2 - x, 2) + Math.pow(canvas.height / 2 - y, 2),
							),
						);
						// bigger towards the center
						size = canvas.width / 2 - size;
						// scale it down
						size /= this.width / 15;
						if (size <= 3) size = 3;
						//else size = 5;
						this.particlesArray.push(new Particle(x, y, size, this));
					}
				}
			}
			// get the logo pixels (there are fewer logo pixels than heart pixels)
			this.ctx.clearRect(0, 0, this.width, this.height);
			this.ctx.drawImage(this.logoImage, imageX, imageY, imageWidth, imageHeight);
			const logoPixels = this.ctx.getImageData(0, 0, this.width, this.height).data;
			const logoXY = [];
			for (let y = 0; y < this.height; y += this.gap) {
				for (let x = 0; x < this.width; x += this.gap) {
					const index = (y * this.width + x) * 4; // 4 because r, g, b, a have separate array positions

					const alpha = logoPixels[index + 3];
					if (alpha > 0) {
						logoXY.push({ x, y });
					}
				}
			}

			// for (let i = 0; i < this.particlesArray.length; i++) {
			// 	this.particlesArray[i].setLogoXY(logoXY[i].x, logoXY[i].y);
			// }

			// iterate over all pixels and give each a random logo location
			this.particlesArray.forEach((particle) => {
				const logoIndex = randomInt(0, logoXY.length - 1);

				const logoX = logoXY[logoIndex].x;
				const logoY = logoXY[logoIndex].y;

				particle.setLogoXY(logoX, logoY);
			});
		}
		swapDestination() {
			if (this.particlesArray) this.particlesArray.forEach((particle) => particle.swapDestination());
		}
		update() {
			this.particlesArray.forEach((particle) => particle.update());
		}
		draw() {
			this.particlesArray.forEach((particle) => particle.draw(this.ctx));
		}
	}

	const effect = new Effect(canvas.width, canvas.height, ctx);
	effect.init();
	// mouse click
	// addEventListener("click", (event) => {
	// 	effect.swapDestination();
	// });
	// // mobile touch
	// addEventListener("touchstart", (event) => {
	// 	effect.swapDestination();
	// });
	addEventListener("keypress", (event) => {
		console.log(event.key);
		const keyPressed = event.key;
		if (keyPressed === "r") mode = "random";
		else if (keyPressed === "h") mode = "heart";
		else if (keyPressed === "l") mode = "logo";
		else if (keyPressed === "f") mode = "falling";
		else if (keyPressed === "o") mode = "offscreen";
	});

	//const mode = "random"; // random, heart, logo, falling, offscreen

	function animate() {
		ctx.fillStyle = "#FEF4EE";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		effect.update();
		effect.draw();
		requestAnimationFrame(animate);
	}
	animate();

	// helper stuff
	function randomInt(lowerBound, upperBound) {
		return Math.floor(Math.random() * (upperBound - lowerBound + 1)) + lowerBound;
	}

	function randomFloat(lowerBound, upperBound) {
		return Math.random() * (upperBound - lowerBound + 1) + lowerBound;
	}

	/**
	 * @notice Helper function to map one scale to another
	 */
	function scale(number, inMin, inMax, outMin, outMax) {
		return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
	}
});
