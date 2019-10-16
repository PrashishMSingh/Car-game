const DEFAULT_ENV_WIDTH = 600
const DEFAULT_ENV_HEIGHT = 600
const FRAME_RATE = 60
const LANE_WIDTH = 500;
const CHANGE_DURATION = 50;
const MAX_RIGHT = 326
const BOTTOM_SPACE = 30;
const MAX_CAR_COUNT = 3;

const OBSTACLE_CAR_DURATION = 2000;
const OBSTACLE_DISTRUCTION_DURATION = 1000;
const ROCKET_LAUNCH_INTERVAL = 100;

const ROCKET_GENERATION_THRES= 0.8;
const MULTI_CAR_PROB = 0.5;
const MAX_AMMO = 16
const INITIAL_GAME_STATE = {
                            gamePoint : 0,
                            obsCarList : [],
                            rocketsList:[],
                            gameSpeed : 7,
                            rocketCount : 5,
                            laneBottomPos : 0
                          }

class GameEnviroment{
    constructor(mainWrapper, envWidth, envHeight){
      this.gameState = {
        gamePoint : 0,
        obsCarList : [],
        rocketsList:[],
        gameSpeed : 7,
        rocketCount : 5,
        laneBottomPos : 0
      }
      this.isStart = true;
      this.envWidth = envWidth;
      this.envHeight = envHeight;
      this.mainWrapper = mainWrapper;
      
      this.gameLaneHeight = (this.envHeight * 10000) 
      this.laneGap = 75.5;
      this.onMove = false;
      this.carYPosList = []
      this.defaultwidth = 45;
      this.defaultheight = 80;
      this.envLeftGap = 100;

      this.autoDrive = true;
      this.gameOver = true;
      this.hasRocketFired = false;
      
      this.renderGameInfo()
      this.renderEnviroment()
    }

    resetGameState = () =>{
      Object.keys(this.gameState).map(key =>{

        this.gameState[key] = INITIAL_GAME_STATE[key]
        if(key == 'obsCarList'){
          this.gameState[key] = []
        }
      })
    }

    renderEnviroment = () =>{
      this.gameView = document.createElement('div');
      this.gameLane = document.createElement('div');

      this.gameLane.style.height = this.gameLaneHeight + 'px';
      this.gameLane.style.width = LANE_WIDTH + 'px';

      this.gameView.style.width = LANE_WIDTH + 'px';
      this.gameView.style.height = this.envHeight + 'px';

      this.gameView.classList.add('game-view')
      this.gameLane.classList.add('game-lane')

      window.addEventListener("keydown", this.KeyDownAction);
      window.addEventListener("keyup", this.attackAction);

      this.mainWrapper.appendChild(this.gameView);
      this.gameView.appendChild(this.gameLane);
    }

    renderGameInfo = () =>{
      this.ammoDisplay = document.getElementsByClassName('ammo-count')[0]
      this.gameMenu = document.getElementsByClassName('game-menu')[0]
      this.playBtn = document.getElementsByClassName('play-btn')[0]
      this.scoreWrapper = document.getElementsByClassName('score-wrapper')[0]
      this.scoreWrapper.style.display='none';
      this.playerScoreElem = document.getElementsByClassName('player-score')[0]
      this.highestScoreElem = document.getElementsByClassName('highest-score')[0]

      this.total_points = document.getElementById('total_points')
      this.playBtn.addEventListener('click', () =>{
        this.gameOver = false;
        this.gameMenu.style.display = 'none'
        if(this.isStart){
          this.resetGameState()
          this.updateAmmoCount()
          this.generateCar()
          this.activateMissile()
          this.updateEnviroment()
          this.generateObstacleCars()
          this.updateScore()
          this.updateAmmoCount()
        }

      })
      this.total_points.innerHTML = this.gameState.gamePoint;
    }

    updateScore = () =>{
      if(!this.gameOver){
        this.total_points.innerHTML = this.gameState.gamePoint;
      }      
    }

    updateAmmoCount = () =>{
      
      this.ammoDisplay.innerHTML = ''      
      for(var i = 0; i < this.gameState.rocketCount; i++){
        var icon = document.createElement('i')
        icon.setAttribute("class", "fas fa-meteor")
        this.ammoDisplay.appendChild(icon)
      }
    }

    generateCar = () =>{
      this.car = new Car(this.defaultwidth, this.defaultheight, this.gameLaneHeight)
      var carImg = './images/car.png';
      this.car.setCarImage(carImg)
      this.car.getElement().classList.add('car')
      this.car.updatePos()
      this.gameLane.appendChild(this.car.getElement())
      if(!this.autoDrive){
        window.addEventListener("keydown", this.moveUpLane);
      }else{
        this.autoMoveFront(this.car)
      }
    }

    generateObstacleCars = () =>{
      var randomCars = setInterval(()=>{
        if(!this.gameOver){
          var moreCarProb = Math.random()
        var carCount = 1
        if(moreCarProb > MULTI_CAR_PROB){
          carCount += Math.floor(Math.random()*MAX_CAR_COUNT) 
        }
        var carXPos = []
        for(var i = 0; i< carCount; i++){
          var randomDigit = Math.floor(Math.random()*4)
          var xPos = ( randomDigit * this.laneGap) + X_START_POS;
          while(carXPos.includes(xPos)){
            xPos = (Math.floor(Math.random()*4) * this.laneGap) + X_START_POS;
          }
          carXPos.push(xPos)
          var yPos = -this.gameState.laneBottomPos + DEFAULT_ENV_HEIGHT;
          var rocketProb = Math.random()
          
          var obsCar = new Car(this.defaultwidth, this.defaultheight, this.gameLaneHeight)
          var obsCarImg = './images/obs_car.png';
          var className = 'obs-car'
          // generate random missiles adder
          if(rocketProb > ROCKET_GENERATION_THRES){
            obsCar.isCar = false;
            className = 'rocket-add';
            obsCarImg = './images/rocket.gif';
          }
          // change direction of car
          else if(randomDigit > 1){
            obsCar.getElement().style.transform = 'rotate(180deg)' 
          }

          obsCar.getElement().classList.add(className)

          obsCar.setCarImage(obsCarImg)
          
          obsCar.setCarXPos(xPos)
          obsCar.setCarYPos(yPos)
          obsCar.updatePos()         

          this.gameState.obsCarList.push(obsCar)
          this.gameLane.appendChild(obsCar.getElement())
        }
      }else{
        clearInterval(randomCars)
      }
    },OBSTACLE_CAR_DURATION)
   }

    updateEnviroment = () =>{
      var speedShiftValue = 4
      var pointsGained = false;
      
      var envInterval = setInterval(() =>{
        if(!this.gameOver){
          this.gameState.obsCarList.map((obsCar, i) =>{
            if(obsCar.yPos < Math.abs(this.gameState.laneBottomPos)){
              this.gameState.obsCarList.splice(i, 1)
              if(obsCar.isCar){
                this.gameState.gamePoint += 1;
                this.updateScore()
              }
              pointsGained = true
            }
          })
          this.checkCollision(this.car)
          if(this.gameState.laneBottomPos <= -(this.gameLaneHeight)){
            this.gameState.laneBottomPos = 0
          }
          this.gameLane.style.bottom = this.gameState.laneBottomPos + 'px';
        }
        else{
          clearInterval(envInterval)
        }
        if((this.gameState.gamePoint % speedShiftValue) === 1 && pointsGained){
          this.gameState.gameSpeed += 1
          pointsGained = false
        }        
      }, FRAME_RATE)
    }


    autoMoveFront = (car) =>{
      var interval = setInterval(() =>{
        if(!this.gameOver){
          this.gameState.laneBottomPos -= this.gameState.gameSpeed;
          car.setCarYPos(-this.gameState.laneBottomPos + BOTTOM_SPACE)
        }else{
          clearInterval(interval)
        }

      }, FRAME_RATE)
    }

    changeDir = (dir) => {
      this.onMove = true;
      var changeSpeed = 8.5
      var currentPos = this.car.xPos;
      var targetPos = this.car.xPos + this.laneGap;
      
      if(dir === 'left'){
        targetPos = this.car.xPos - this.laneGap;
      }
      var changeInterval  = setInterval(() =>{
        if(!this.gameOver){
          if(dir === 'left'){
            if(currentPos >= targetPos){
              this.car.getElement().style.transform = 'rotate(-10deg)'
              currentPos -= changeSpeed
            }else{
              this.car.getElement().style.transform = 'rotate(0deg)'
              clearInterval(changeInterval)
              this.onMove = false;
            }
          }else{
            if(currentPos <= targetPos){
              currentPos += changeSpeed
              this.car.getElement().style.transform = 'rotate(10deg)'
              
            }else{
              clearInterval(changeInterval)
              this.car.getElement().style.transform = 'rotate(0deg)'
              this.onMove = false;
            }       
          }
        }
        this.car.xPos = currentPos
      }, CHANGE_DURATION)
    }

    hasDestroyedCar = (rocket) =>{
      var destroyedCarIndex = -1;
      this.gameState.obsCarList.map((obs, i) => {
        // for car
        var rightCollision = rocket.xPos + rocket.width >= obs.xPos
        var leftCollision = rocket.xPos <= obs.xPos + obs.width
        var bottomCollision = rocket.yPos + rocket.height >= obs.yPos 
        var topCollision = rocket.yPos <= obs.yPos + obs.height
        
        if(obs.isCar && leftCollision && rightCollision && topCollision && bottomCollision && rocket.isArmed){              
          destroyedCarIndex = i;
          var blastImgPath = './images/blast.gif' 
          obs.setCarImage(blastImgPath)
          this.gameState.gamePoint += 1;
          this.updateScore()
          rocket.isArmed = false;
          this.gameState.rocketsList = this.gameState.rocketsList.filter(singleRocket =>  singleRocket !== rocket)
          this.updateAmmoCount()
          this.gameLane.removeChild(rocket.getElement())
          setTimeout(() =>{
            this.gameLane.removeChild(obs.getElement())
          }, OBSTACLE_DISTRUCTION_DURATION)
        }
      })
      if(destroyedCarIndex >= 0){ 
        
        this.gameState.obsCarList.splice(destroyedCarIndex, 1)
      }
    }

    hasRocketReachedEnd = (rocket) =>{
      var rocketYPos = rocket.yPos;
      var reachedEnd = false;
      if(rocketYPos > Math.abs(this.gameState.laneBottomPos + DEFAULT_ENV_HEIGHT)){
        this.gameState.rocketsList = this.gameState.rocketsList.filter(singleRocket => singleRocket !== rocket)
        this.updateAmmoCount()
      }      
    }

    activateMissile = () =>{
    var rocketInterval = setInterval(() =>{
      if(!this.gameOver){
        if(this.hasRocketFired && this.gameState.rocketCount){
          var rocketYPos = this.car.yPos;
          var rocketXPos = this.car.xPos;
          var rocketWidth = 60;
          var rocketHeight = 60;
          var rocket =  new Rocket(this.gameLane, rocketXPos, rocketYPos, rocketWidth, rocketHeight);
          rocket.launch(this.hasDestroyedCar, this.hasRocketReachedEnd)    
          this.gameState.rocketCount -= 1;
          this.gameState.rocketsList.push(rocket)
        }
      }
      else{
        clearInterval(rocketInterval)
      }

    }, ROCKET_LAUNCH_INTERVAL)
  }

    attackAction = (e) =>{
      var keyCode = e.keyCode
      var sideGap = 100
      if(!this.onMove){
        switch(keyCode){          
          case 32:
            this.hasRocketFired = false
            break;

          default:
            break;
        }
      }
    }

    KeyDownAction = (e) =>{
      var keyCode = e.keyCode
      if(!this.onMove){
        switch(keyCode){
          case 37:
            if(this.car.xPos > X_START_POS){
                this.changeDir('left')
            }
            break;
  
          case 39:
            if(this.car.xPos < MAX_RIGHT){
              this.changeDir('right')
            }
            break;
          
          case 32:
            this.hasRocketFired = true
            break;

          default:
            break;
        }
      }
    }

    endGame = () =>{
      this.gameMenu.style.display = 'block'
      this.scoreWrapper.style.display='block';
      this.playerScoreElem.innerHTML = this.gameState.gamePoint;
      this.gameLane.innerHTML = ''
      var highScoreStore = window.localStorage.getItem('high_score')
      var playerScore = this.gameState.gamePoint
      if(highScoreStore){
        if(highScoreStore < playerScore){
          window.localStorage.setItem('high_score', playerScore)
        }else{
          playerScore = highScoreStore
        }
      }else{
        window.localStorage.setItem('high_score', playerScore)
      }
      this.highestScoreElem.innerHTML = playerScore
    }
    

    checkCollision = (car) => {
      this.gameState.obsCarList.map(obs => {
        // for car
        var rightCollision = car.xPos + car.width >= obs.xPos
        var leftCollision = car.xPos <= obs.xPos + obs.width
        var bottomCollision = car.yPos + car.height >= obs.yPos 
        var topCollision = car.yPos <= obs.yPos + obs.height
        
        if(!obs.isTouched && leftCollision && rightCollision && topCollision && bottomCollision){    
          obs.isTouched = true;
          if(obs.isCar && !this.gameOver){
            var blastImgPath = './images/blast.gif' 
            car.setCarImage(blastImgPath)
            this.gameOver = true;
            setTimeout(() =>{
              this.endGame()
            }, 2000)
          }
          
          else{
            obs.getElement().style.display = 'none'
            if(this.gameState.rocketCount < MAX_AMMO){              
              this.gameState.rocketCount += 2;
              this.updateAmmoCount()
            }
          }
        }
      })

    }
}

var mainWrapper = document.getElementsByClassName('game-board')[0];
var gameEnviroment = new GameEnviroment(mainWrapper, DEFAULT_ENV_WIDTH, DEFAULT_ENV_HEIGHT);


