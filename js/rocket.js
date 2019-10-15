const ROCKET_SPEED = 50
class Rocket{
    constructor(parentElement, xPos, yPos, width, height){
      this.parentElement = parentElement
      this.speed = ROCKET_SPEED;
      this.width = width;
      this.height = height;
      this.xPos = xPos;
      this.yPos = yPos;
      this.isArmed = true;
      this.generateRocket()
    }
  
    generateRocket = () =>{
      this.rocketDiv = document.createElement('div')
      this.rocketDiv.setAttribute('class', 'rocket-div')
      this.rocketDiv.style.width = this.width + 'px';
      this.rocketDiv.style.height = this.height + 'px';

      var rocketImg = document.createElement('img');
      var rocketGif = './images/rocket.gif';
      rocketImg.setAttribute('src', rocketGif)
      rocketImg.setAttribute('width', '100%')
      rocketImg.setAttribute('height', '100%')
      this.rocketDiv.appendChild(rocketImg);
      this.parentElement.appendChild(this.rocketDiv)
    }
  
    draw = () =>{
      this.rocketDiv.style.bottom = this.yPos + 'px'
      this.rocketDiv.style.left = this.xPos + 'px'
    }
  
    move = () =>{
      this.yPos += this.speed;
    }

    getElement = () =>{
        return this.rocketDiv
    }
  
    launch = (hasDestroyedCar, hasRocketReachedEnd)=>{
      var interval = setInterval(() =>{
        hasRocketReachedEnd(this)
          if(!hasDestroyedCar(this)){
            this.move()
            this.draw()
          }else{
              clearInterval(interval)
          }
      }, FRAME_RATE)
    }
  
  }