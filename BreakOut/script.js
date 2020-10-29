const dpi = window.devicePixelRatio;

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const style = {
    height() {
        return +getComputedStyle(canvas).getPropertyValue('height').slice(0, -2);
    },
    width() {
        return +getComputedStyle(canvas).getPropertyValue('width').slice(0, -2);
    }
}

canvas.setAttribute('width', style.width() * dpi);
canvas.setAttribute('height', style.height() * dpi);
CanvasRenderingContext2D.prototype.roundedRectangle = function (x, y, width, height, rounded) {
    const radiansInCircle = 2 * Math.PI
    const halfRadians = (2 * Math.PI) / 2
    const quarterRadians = (2 * Math.PI) / 4

    // top left arc
    this.arc(rounded + x, rounded + y, rounded, -quarterRadians, halfRadians, true)

    // line from top left to bottom left
    this.lineTo(x, y + height - rounded)

    // bottom left arc  
    this.arc(rounded + x, height - rounded + y, rounded, halfRadians, quarterRadians, true)

    // line from bottom left to bottom right
    this.lineTo(x + width - rounded, y + height)

    // bottom right arc
    this.arc(x + width - rounded, y + height - rounded, rounded, quarterRadians, 0, true)

    // line from bottom right to top right
    this.lineTo(x + width, y + rounded)

    // top right arc
    this.arc(x + width - rounded, y + rounded, rounded, 0, -quarterRadians, true)

    // line from top right to top left
    this.lineTo(x + rounded, y)
}

const PADDLE_WIDTH = canvas.width / 12;
const PADDLE_MARGIN_BOTTOM = canvas.height / 12;
const PADDLE_HEIGHT = canvas.height / 30;
const BALL_RADIUS = 8;
const BRICK_WIDTH = canvas.width / 12;
const BRICK_HEIGHT = canvas.height / 20;
const LEVELS = 3;

const bgImage = new Image();
bgImage.src = "assets/bg.jpg";

const lifeImage = new Image();
lifeImage.src = "assets/life.png";

const coinImage = new Image();
coinImage.src = "assets/coin1.png";

const reward10Image = new Image();
reward10Image.src = "assets/ten.png";

const reward20Image = new Image();
reward20Image.src = "assets/twenty.png";

const l1Image = new Image();
l1Image.src = 'assets/level1.png'

const l2Image = new Image();
l2Image.src = 'assets/level2.png'

const l3Image = new Image();
l3Image.src = 'assets/level3.png'

const levelUpSound = new Audio();
levelUpSound.src = "assets/level.mp3"

const gameWonSound = new Audio();
gameWonSound.src = "assets/won.mp3"

const paddleHitSound = new Audio();
paddleHitSound.src = "assets/paddle_hit.mp3"

const wallHitSound = new Audio();
wallHitSound.src = "assets/wall.mp3"

const lifeLostSound = new Audio();
lifeLostSound.src = "assets/life_lost.mp3"

const brickHitSound = new Audio();
brickHitSound.src = "assets/brick_hit.mp3"

const brickBrokeSound = new Audio();
brickBrokeSound.src = "assets/brick_broke.mp3"

const fruitSound = new Audio();
fruitSound.src = "assets/fruit.mp3"

const gameOverSound = new Audio();
gameOverSound.src = "assets/gameOver.mp3";

// function Paddle(){
//     this.x = 
// } 

// const paddle = new Paddle();
// paddle.x+=1; 

const paddle = {
    x: canvas.width / 2 - PADDLE_WIDTH / 2,
    y: canvas.height - PADDLE_MARGIN_BOTTOM - PADDLE_HEIGHT,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dx: 10,
    color: "#0095DD"
}

const ball = {
    x: canvas.width / 2,
    y: paddle.y - BALL_RADIUS,
    radius: BALL_RADIUS,
    speed: 4,
    dx: 3 * (Math.random() * 2 - 1),
    dy: -3
}

const brick = {
    rc: 4,
    cc: Math.floor(canvas.width / (PADDLE_WIDTH + 20)),
    width: BRICK_WIDTH,
    height: BRICK_HEIGHT,
    padding: 10,
    top: 75,
    left: 40
}

const player = {
    score: 0,
    lives: 3,
    level: 1
}

const keyStatus = {
    rightPressed: false,
    leftPressed: false
}

let bricks = [];
var fruits = [];
const loadAssets = () => {
    for (let r = 0; r < brick.rc; r++) {
        bricks[r] = [];
        for (let c = 0; c < brick.cc; c++) {
            bricks[r][c] = { x: 0, y: 0, status: 2 };
            let randNum = Math.floor(Math.random()*11)
            if (randNum == 2) {
                bricks[r][c].fruit = 20;
                bricks[r][c].color = "#39FF14";
                bricks[r][c].got = false;
            } else if (randNum == 7) {
                bricks[r][c].fruit = 10;
                bricks[r][c].color = "#FAED27";
                bricks[r][c].got = false;
            }
        }
    }
}

loadAssets();

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("touchmove", touchHandler, false);

function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        keyStatus.rightPressed = true;
    }
    else if (e.key == "Left" || e.key == "ArrowLeft") {
        keyStatus.leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        keyStatus.rightPressed = false;
    }
    else if (e.key == "Left" || e.key == "ArrowLeft") {
        keyStatus.leftPressed = false;
    }
}


function mouseMoveHandler(e) {
    let relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width;
    }
    if(paddle.x<0){
        paddle.x=0;
    }
    if((paddle.x + paddle.width) >canvas.width){
        paddle.x = canvas.width - paddle.width;
    }
}

function touchHandler(e) {
    if (e.touches) {
        let relativeX = e.touches[0].clientX - canvas.offsetLeft;
        if (relativeX > 0 && relativeX < canvas.width) {
            paddle.x = e.touches[0].clientX - canvas.offsetLeft - paddle.width / 2;

            e.preventDefault();
        }


    }
}


function collisionDetection() {
    for (let r = 0; r < brick.rc; r++) {
        for (let c = 0; c < brick.cc; c++) {
            let b = bricks[r][c];

            if (b.status == 2) {
                if ((ball.x + ball.radius) > b.x && (ball.x - ball.radius) < (b.x + brick.width) && (ball.y + ball.radius) > b.y && (ball.y - ball.radius) < (b.y + brick.height)) {
                    bricks[r][c].status = 1;
                    ball.dy = -ball.dy;
                    brickHitSound.play();
                }
            }
            else if (b.status == 1) {
                if ((ball.x + ball.radius) > b.x && (ball.x - ball.radius) < (b.x + brick.width) && (ball.y + ball.radius) > b.y && (ball.y - ball.radius) < (b.y + brick.height)) {
                    ball.dy = -ball.dy;
                    brickBrokeSound.play();
                    bricks[r][c].status = 0;
                    if (bricks[r][c].fruit) {
                        fruits.push(bricks[r][c])
                    }
                    player.score++;
                }
            }
        }
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = paddle.y - 10;
    ball.dx = 3 * (Math.random() * 2 - 1);
    ball.dy = -3;
    paddle.x = (canvas.width - paddle.width) / 2;
}

function drawLevel() {

    if (player.level == 1) {
        ctx.drawImage(l1Image, canvas.width / 2 - 20, 20);
    } else if (player.level == 2) {
        ctx.drawImage(l2Image, canvas.width / 2 - 20, 20);
    } else if (player.level == 3) {
        ctx.drawImage(l3Image, canvas.width / 2 - 20, 20);
    }
    // ctx.font = "16px Arial";
    // ctx.fillStyle = "#FFFFFF";
    // ctx.fillText("Level: " + player.level, canvas.width/2, 20);
}

function drawFruits() {
    for (reward of fruits) {
        if (!reward.got) {
            if (reward.fruit == 10 && !reward.got) {
                ctx.drawImage(reward10Image, reward.x, reward.y);
            } else if (reward.fruit == 20 && !reward.got) {
                ctx.drawImage(reward20Image, reward.x, reward.y);
            }
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}
function drawPaddle() {
    ctx.beginPath();
    ctx.roundedRectangle(paddle.x, paddle.y, paddle.width, paddle.height, 15);
    ctx.fillStyle = paddle.color;
    ctx.fill();
    ctx.closePath();
}
function drawBricks() {
    let big, small;
    for (let r = 0; r < brick.rc; r++) {
        if (r == 0) {
            big = "#003366";
            small = "#99CCFF";
        } else if (r == 1) {
            big = "#0B5345";
            small = "#59D68D";
        } else {
            big = "#D35400";
            small = "#EB984E";
        }
        for (let c = 0; c < brick.cc; c++) {
            if (bricks[r][c].status != 0) {
                let brickX = (c * (brick.width + brick.padding)) + brick.left;
                let brickY = (r * (brick.height + brick.padding)) + brick.top;
                bricks[r][c].x = brickX;
                bricks[r][c].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brick.width, brick.height);
                if (bricks[r][c].status == 2) {
                    if(bricks[r][c].fruit==20){
                        ctx.fillStyle = "#003366";
                    }else if(bricks[r][c].fruit==10){
                        ctx.fillStyle = "#0B5345";
                    }else{
                        ctx.fillStyle = "#D35400";
                    }
                } else if (bricks[r][c].status == 1) {
                    if(bricks[r][c].fruit==20){
                        ctx.fillStyle = "#99CCFF";
                    }else if(bricks[r][c].fruit==10){
                        ctx.fillStyle = "#59D68D";
                    }else{
                        ctx.fillStyle = "#EB984E";
                    }
                }
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}
function drawScore() {
    ctx.drawImage(coinImage, 20, 10)
    ctx.font = "30px Arial bold";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(player.score, 60, 40);
}
function drawLives() {
    let x = canvas.width - 80;

    for (let i = 0; i < player.lives; i++) {
        ctx.drawImage(lifeImage, x, 20);
        x -= 50;
    }
}


function draw() {
    // gameStartSound.play();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx .drawImage(bgImage, 0, 0)
    drawBricks();
    drawBall();
    drawPaddle();
    drawLevel();
    drawScore();
    drawFruits();
    drawLives();
    collisionDetection();

    let won = true;
    for (r = 0; r < brick.rc; r++) {
        let flag = 0;
        for (c = 0; c < brick.cc; c++) {
            if (bricks[r][c].status != 0) {
                flag = 1;
                won = false;
            }
        }
        if (flag == 1) {
            break;
        }
    }

    if (won) {

        if (player.level >= LEVELS) {
            gameWonSound.play();
            showYouWin();
            // alert(`YOU WIN, CONGRATS! Score = ${player.score}`);
            clearInterval(interval);
            return;
            // document.location.reload();
        } else {
            levelUpSound.play();
            player.level += 1
            player.score += 50;
            player.lives = 5;
            brick.rc += 1;
            ball.speed += 2;
            resetBall();
            loadAssets();
        }

    }

    if ((ball.x + ball.radius) > canvas.width || (ball.x - ball.radius) < 0) {
        ball.dx = -ball.dx;
        wallHitSound.play();
    }
    if ((ball.y - ball.radius) < 0) {
        ball.dy = -ball.dy;
        wallHitSound.play();
    }
    else if (ball.y < paddle.y) {

    }
    else if (ball.y > paddle.y && ball.x > paddle.x && ball.x < (paddle.x + paddle.width)) {
        paddleHitSound.play();
        let collidePoint = ball.x - (paddle.x + paddle.width / 2);
        collidePoint /= paddle.width / 2;

        let angle = collidePoint * Math.PI / 3;

        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.dy
    }
    else if ((ball.y + ball.radius) > canvas.height) {
        player.lives--;
        lifeLostSound.play();
        if (!player.lives) {
            gameOverSound.play();
            showYouLose();
            // alert('Game over');
            clearInterval(interval);
            // document.location.reload();
            return;
        }
        else {
            resetBall();
        }
    }

    for (i in fruits) {
        if (fruits[i].y <= paddle.y) {
            fruits[i].y += 1;
        } else if (paddle.y < fruits[i].y && fruits[i].y < (paddle.y + paddle.height)) {
            if (paddle.x < fruits[i].x && fruits[i].x < (paddle.x + paddle.width)) {
                fruitSound.play();
                if (fruits[i].fruit == 20 && !fruits[i].got) {
                    paddle.color = "#39FF14";
                    player.score += 20;
                    fruits[i].got = true;
                } else if (fruits[i].fruit == 10 && !fruits[i].got) {
                    paddle.color = "#FAED27";
                    player.score += 10;
                    fruits[i].got = true;
                }
            }

            fruits[i].y += 1
        }
    }
    fruits = fruits.filter((reward) => {
        if (reward.y >= (paddle.y + paddle.height)) {
            return false
        } else {
            return true
        }
    });


    if (keyStatus.rightPressed && paddle.x < (canvas.width - paddle.width)) {
        paddle.x += paddle.dx;
    }
    else if (keyStatus.leftPressed && paddle.x > 0) {
        paddle.x -= paddle.dx;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;
}

var interval = setInterval(draw, 10);

const gameover = document.getElementById("gameover");
const youwin = document.getElementById("youwin");
const youlose = document.getElementById("youlose");
const restart = document.getElementById("restart");

restart.addEventListener("click", function () {
    location.reload(); // reload the page
})

function showYouWin() {
    gameover.style.display = "flex";
    youwon.style.display = "block";
}

function showYouLose() {
    gameover.style.display = "flex";
    youlose.style.display = "block";
}
