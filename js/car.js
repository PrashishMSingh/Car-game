const X_START_POS = 115
class Car{
  constructor(width, height, envWidth, speed){
    this.width = width;
    this.height = height;
    this.isCar = true;
    this.isTouched = false;
    this.envWidth = envWidth;
    this.speed = speed;
    this.xPos = X_START_POS;
    this.yPos = 0;
    this.renderCar()
    this.isDestroyed = false;
  }

  renderCar = () =>{
    this.car = document.createElement('div')
    this.carImg = document.createElement('img');
    this.carImg.setAttribute('width', this.width);
    this.carImg.setAttribute('height', this.height);
    this.car.appendChild(this.carImg)
    this.car.style.width = this.width + 'px';
    this.car.style.height = this.height + 'px';
  }

  setCarImage = (imgSrc) =>{
    this.carImg.setAttribute('src', imgSrc);
  }

  getElement = () =>{
    return this.car
  }

  setCarXPos = (xPos) =>{
    this.xPos = xPos;
  }

  setCarYPos = (yPos) =>{
    this.yPos = yPos
  }

  draw = () =>{
    this.car.style.left = this.xPos + 'px';
    this.car.style.bottom = this.yPos + 'px';
  }

  move = () =>{
    this.yPos += this.speed;
  }

  updatePos = () =>{
    var update = setInterval(() =>{
      this.draw()
    }, FRAME_RATE)
  }

  moveCar = () =>{
    var moveInterval = setInterval(()=>{
      this.move()
      this.draw()
    })
  }

}
