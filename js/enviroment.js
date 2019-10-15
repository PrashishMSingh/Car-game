const DEFAULT_ENV_WIDTH = 600
const DEFAULT_ENV_HEIGHT = 600
const FRAME_RATE = 60
const LANE_WIDTH = 500;
const CHANGE_DURATION = 50;
const MAX_RIGHT = 326
const BOTTOM_SPACE = 30;

const OBSTACLE_CAR_DURATION = 3000;
const ROCKET_LAUNCH_INTERVAL = 100;

const ROCKET_GENERATION_THRES= 0.8;

class GameEnviroment{
    constructor(mainWrapper, envWidth, envHeight){
      this.envWidth = envWidth;
      this.envHeight = envHeight;
      this.mainWrapper = mainWrapper;
      this.laneBottomPos = 0
      this.gameLaneHeight = (this.envHeight * 100) 
      this.laneGap = 75.5;
      this.onMove = false;
      this.carYPosList = []
      this.defaultwidth = 45;
      this.defaultheight = 80;
      this.envLeftGap = 100;
      this.obsCarList = []
      this.rocketsList = []
      this.gamePoint = 0
      this.rocketLimit = 5;

      this.autoDrive = true;
      this.gameOver = false;
      this.hasRocketFired = false;

      this.gameSpeed = 7;
      

      this.renderEnviroment()
      this.generateCar()
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
      this.setEnviromentStyle()
    }

    generateCar = () =>{
      this.car = new Car(this.defaultwidth, this.defaultheight, this.gameLaneHeight)
      var carImg = './images/car.png';
      this.car.setCarImage(carImg)
      this.car.getElement().classList.add('car')
      this.car.updatePos()
      this.gameLane.appendChild(this.car.getElement())
      this.activateRocket()
      if(!this.autoDrive){
        window.addEventListener("keydown", this.moveUpLane);
      }else{
        this.autoMoveFront(this.car)
      }
    }

    generateObstacleCars = () =>{
      var randomCars = setInterval(()=>{
        var moreCarProb = Math.random()
        var carCount = 1
        if(moreCarProb > 0.5){
          carCount += Math.floor(Math.random()*2) 
        }

        for(var i = 0; i< carCount; i++){
          var xPos = (Math.floor(Math.random()*4) * this.laneGap) + X_START_POS;
          var yPos = -this.laneBottomPos + DEFAULT_ENV_HEIGHT;
          var rocketProb = Math.random()
          var obsCar = new Car(this.defaultwidth, this.defaultheight, this.gameLaneHeight)
          var obsCarImg = './images/car.png';
          var className = 'obs-car'

          if(rocketProb > ROCKET_GENERATION_THRES){
            obsCar.isCar = false;
            className = 'rocket-add';
            obsCarImg = './images/rocket.gif';
          }
          obsCar.getElement().classList.add(className)

          obsCar.setCarImage(obsCarImg)
          
          obsCar.setCarXPos(xPos)
          obsCar.setCarYPos(yPos)
          obsCar.updatePos()         

          this.obsCarList.push(obsCar)
          this.gameLane.appendChild(obsCar.getElement())
        }
      },OBSTACLE_CAR_DURATION)
    }

    updateEnviroment = () =>{
      var speedShiftValue = 4
      var pointsGained = false;
      var envInterval = setInterval(() =>{
        if(!this.gameOver){
          this.obsCarList.map((obsCar, i) =>{
            if(obsCar.yPos < Math.abs(this.laneBottomPos)){
              this.obsCarList.splice(i, 1)
              this.gamePoint += 1;
              pointsGained = true
              console.log(this.gamePoint)
            }
          })
          this.checkCollision(this.car)
          if(this.laneBottomPos <= -(this.gameLaneHeight)){
            this.laneBottomPos = 0
          }
          this.gameLane.style.bottom = this.laneBottomPos + 'px';
        }
        else{
          clearInterval(envInterval)
        }
        if((this.gamePoint % speedShiftValue) === 1 && pointsGained){
          this.gameSpeed += 1
          pointsGained = false
        }        
      }, FRAME_RATE)
    }

    autoMoveFront = (car) =>{
      var interval = setInterval(() =>{
        if(!this.gameOver){
          this.laneBottomPos -= this.gameSpeed;
          car.setCarYPos(-this.laneBottomPos + BOTTOM_SPACE)
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
      this.obsCarList.map((obs, i) => {
        // for car
        var rightCollision = rocket.xPos + rocket.width >= obs.xPos
        var leftCollision = rocket.xPos <= obs.xPos + obs.width
        var bottomCollision = rocket.yPos + rocket.height >= obs.yPos 
        var topCollision = rocket.yPos <= obs.yPos + obs.height
        
        if(obs.isCar && leftCollision && rightCollision && topCollision && bottomCollision && rocket.isArmed){              
          destroyedCarIndex = i;
          var blastImgPath = './images/blast.gif' 
          obs.setCarImage(blastImgPath)
          this.gamePoint += 1;
          rocket.isArmed = false;
          this.rocketsList = this.rocketsList.filter(singleRocket =>  singleRocket !== rocket)
          this.gameLane.removeChild(rocket.getElement())
          setTimeout(() =>{
            this.gameLane.removeChild(obs.getElement())
          }, 2000)
        }
      })
      if(destroyedCarIndex >= 0){ 
        
        this.obsCarList.splice(destroyedCarIndex, 1)
      }
      
      

    }

    hasRocketReachedEnd = (rocket) =>{
      var rocketYPos = rocket.yPos;
      if(rocketYPos > Math.abs(this.laneBottomPos + DEFAULT_ENV_HEIGHT)){
        this.rocketsList = this.rocketsList.filter(singleRocket => singleRocket !== rocket)
      }else{
        
      }
      
    }

    activateRocket = () =>{
      var rocketInterval = setInterval(() =>{
        if(this.hasRocketFired && this.rocketLimit){
          var rocketYPos = this.car.yPos;
          var rocketXPos = new Number(this.car.xPos + 5);
          var rocketWidth = 60;
          var rocketHeight = 60;
          var rocket =  new Rocket(this.gameLane, rocketXPos, rocketYPos, rocketWidth, rocketHeight);
          rocket.launch(this.hasDestroyedCar, this.hasRocketReachedEnd)    
          this.rocketLimit -= 1;
          this.rocketsList.push(rocket)
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
      var sideGap = 100
      if(!this.onMove){
        switch(keyCode){
          case 37:
            if(this.car.xPos > sideGap){
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
    

    checkCollision = (car) => {
      this.obsCarList.map(obs => {
        // for car
        var rightCollision = car.xPos + car.width >= obs.xPos
        var leftCollision = car.xPos <= obs.xPos + obs.width
        var bottomCollision = car.yPos + car.height >= obs.yPos 
        var topCollision = car.yPos <= obs.yPos + obs.height
        
        if(!obs.isTouched && leftCollision && rightCollision && topCollision && bottomCollision){    
          obs.isTouched = true;
          if(obs.isCar){
            var blastImgPath = './images/blast.gif' 
            this.gameOver = true;
            car.setCarImage(blastImgPath)
            setTimeout(() =>{
              this.gameLane.removeChild(car.getElement())
            }, 2000)
          }
          
          else{
            obs.getElement().style.display = 'none'
            this.rocketLimit += 2;
            console.log(this.rocketLimit)
          }
        }
      })

    }

    setEnviromentStyle = () =>{
      this.mainWrapper.style.height = this.envHeight + 'px';
      this.mainWrapper.style.backgroundColor = '#fcfcfc';
      this.mainWrapper.style.borderRadius = '5px'
    }
}

var mainWrapper = document.getElementsByClassName('game-board')[0];
var gameEnviroment = new GameEnviroment(mainWrapper, DEFAULT_ENV_WIDTH, DEFAULT_ENV_HEIGHT);

gameEnviroment.updateEnviroment()
gameEnviroment.generateObstacleCars()
