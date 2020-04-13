/* A simple model of epidemics, inspired by a post by Harry Stevens in the Washington Post on March 14, 2020,
   https://www.washingtonpost.com/graphics/2020/world/corona-simulator/

   Copyright (c) 2020 Andrej Bauer. This work is licenced under the MIT licence.

   DISCLAIMER: this simulation illustrates the qualitative mathematical aspects of epidemics for illustration purposes only.
   It is *not* a validated model of actual epidemics and no conclusions should be drawn from it regarding health policy.
*/

/* Colors of sick, healthy, immune and dead balls. */
const SICK_COLOR = "#B11C1C";
const HEALTHY_COLOR = "#8B8B8B";
const IMMUNE_COLOR = "#A83535";
const DEAD_COLOR = "#F8B2B2";

const FRAME_RATE = 30;

/* The area where the balls are animated */
var arena; /* initialized below */
let arenaWidth = 640;
let arenaHeight = 480;

/* The area where the graph is drawn */
var graph; /* initalized below */
let graphWidth = 20*FRAME_RATE;  /* the width of the statistics bar */
let graphHeight = 100; /* the height of statistics bar */

/* Other GUI elements */
let socialDistanceSlider = undefined ;
let mortalitySlider = undefined ;
let sickTimeSlider = undefined ;
let restartButton = undefined ;

/* ball status */
let DEAD = -2;
let HEALTHY = -1;
let IMMUNE = 0;
/* positive values are time-to-still-be-sick */

/* gather parameters*/
var quarantine="stay";
var ppe="none";

function debug(msg) {
    document.getElementById('debug').innerHTML = document.getElementById('debug').innerHTML + msg;
}

/*********** BALL ************/

function Ball(x, y, direction, id, model, role) {
    this.x = x;
    this.y = y;
    this.diameter = (arenaWidth + arenaHeight) / 150 ;
    this.direction = direction;
    this.stationary = false;
    this.id = id;
    this.model = model;
    this.status = HEALTHY;
    this.role=role;
    this.isHealthy = function () { return (this.status == HEALTHY); };
    this.isImmune = function () { return (this.status == IMMUNE); };
    this.isDead = function () { return (this.status == DEAD); };
    this.isSick = function () { return (this.status > 0) ; };
    this.deadTime=0;
    this.source="";
    if(this.role=="Normal"&&.9>Math.random()&&!(this.id==0||this.id==1||this.id==2||this.id==3)){
      this.stationary=true;
    }
    /* interact with a ball whose status is s and whose role is r and whose source is t. */
    this.contactWith = function (s,r,t) {
        if (this.isHealthy() && (s > 0)) {
          if(this.id==this.model.population){
              this.makeSick(t);
          }
          if(r=="Doctor"&&!(quarantine=="leave"&&this.x>arenaWidth/2-10&&this.x<arenaWidth/2+10&&this.y>arenaHeight/2-10&&this.y<arenaHeight/2+10)){
            this.makeSick(t);
          }

          else{this.makeSick(t);}

        }
    }
    this.makeSick=function(t){
      let random=Math.random();
      if(this.role=="Doctor"){
        if(this.id==this.model.population){
          this.status = this.model.sickTime;
          this.source="doctor";
        }
        else{
        if(ppe=="n95"){
          if(random<.05){
            this.status = this.model.sickTime;
            this.source="doctor";
          }

        }
        if(ppe=="mask"){
          if(random<.5){
            this.status = this.model.sickTime;
            this.source="doctor";

          }
        }
        if(ppe=="none"){
        this.status = this.model.sickTime;
        this.source="doctor";
      }}
      }
      else{
        this.status = this.model.sickTime;
        this.source=t;
        if(Math.random()>.8){
        this.stationary=false;
        /*calculate initial direction towards hospital*/
        let dx=arenaWidth/2-this.x;
        let dy=arenaHeight/2-this.y;
        let baseangle=Math.atan(dy/dx);
        if(dx<0){this.direction=baseangle+Math.PI;}
        else{this.direction=baseangle;}}
      }
    }
    this.statusColor = function () {
        if (this.isHealthy()) { return HEALTHY_COLOR; }
        else if (this.isImmune()) { return IMMUNE_COLOR; }
        else if (this.isDead()) { return DEAD_COLOR; }
        else { return SICK_COLOR; }
    }

    this.step = function() {
        if (this.isSick()) {
            this.status--;
            if(this.role=="Doctor"&&quarantine=="leave"&&this.status<this.model.sickTime/1.25){
              let dx=arenaWidth/2-this.x;
              let dy=arenaHeight/2-this.y;
              let baseangle=Math.atan(dy/dx);
              if(dx<0){this.direction=baseangle+Math.PI;}
              else{this.direction=baseangle;}
            }
            if (this.status == 0) {
                this.status = (this.model.mortality < Math.random()) ? IMMUNE : DEAD;
                if(this.isDead()){
                  this.deadTime=17;
                }
                if(this.role=="Doctor"&&quarantine=="leave"){
                  this.direction=Math.random()*2*Math.PI;
                }
            }
        }
        if (this.isDead()&&this.deadTime!=0){
          this.deadTime--;
          if(model.currentTime==model.maxTime-2){
            this.deadtime=0;
          }
        }
        if (!this.stationary && !this.isDead()) {
            if(this.role=="Doctor"){
              //bounce far right
              if(this.x>arenaWidth/2+75&&this.y<arenaHeight/2+30&&this.y>arenaHeight/2-30){
                this.direction=-this.direction+Math.PI;
                this.x-=2;
                }
              //right
                if(this.x>arenaWidth/2+25&&(this.y>arenaHeight/2+30||this.y<arenaHeight/2-30)){
                  this.direction=-this.direction+Math.PI;
                  this.x-=2;
                  }
                //far left
                if(this.x<arenaWidth/2-75&&this.y<arenaHeight/2+30&&this.y>arenaHeight/2-30){
                  this.direction=-this.direction+Math.PI;
                  this.x+=2;
                  }
                //left
                  if(this.x<arenaWidth/2-25&&(this.y>arenaHeight/2+30||this.y<arenaHeight/2-30)){
                    this.direction=-this.direction+Math.PI;
                    this.x+=2;
                    }
              //far bottom
              if(this.y<arenaHeight/2-70&&this.x>arenaWidth/2-30&&this.x<arenaWidth/2+30){
                this.direction=-1*this.direction;
                this.y+=2;
              }
              //bottom
              if(this.y<arenaHeight/2-25&&(this.x<arenaWidth/2-30||this.x>arenaWidth/2+30)){
                this.direction=-1*this.direction;
                this.y+=2;
              }
              //far top
              if(this.y>arenaHeight/2+70&&this.x>arenaWidth/2-30&&this.x<arenaWidth/2+30){
                this.direction=-1*this.direction;
                this.y-=2;
              }
              //top
              if(this.y>arenaHeight/2+25&&(this.x<arenaWidth/2-30||this.x>arenaWidth/2+30)){
                this.direction=-1*this.direction;
                this.y-=2;
              }
              if(this.isSick()&&quarantine=="leave"){
                this.x = (this.x + this.model.velocity() * Math.cos(this.direction)/3.5 + arenaWidth) % arenaWidth ;
                this.y = (this.y + this.model.velocity() * Math.sin(this.direction)/3.5 + arenaHeight) % arenaHeight ;
              }
              else{
              this.x = (this.x + this.model.velocity() * Math.cos(this.direction) + arenaWidth) % arenaWidth ;
              this.y = (this.y + this.model.velocity() * Math.sin(this.direction) + arenaHeight) % arenaHeight ;
            }
            }

          else{
            //far right
            if(this.x<arenaWidth/2+45&&this.x>arenaWidth/2&&this.y<arenaHeight/2+10&&this.y>arenaHeight/2-10){
              this.direction=-this.direction+Math.PI;
              this.x+=2;
              }
            //right
              if(this.x<arenaWidth/2+10&&this.x>arenaWidth/2&&((this.y>arenaHeight/2+10&&this.y<arenaHeight/2+50)||(this.y<arenaHeight/2-10&&this.y>arenaHeight/2-50))){
                this.direction=-this.direction+Math.PI;
                this.x+=2;
                }
              //far left
              if(this.x>arenaWidth/2-45&&this.x<arenaWidth/2&&this.y<arenaHeight/2+10&&this.y>arenaHeight/2-10){
                this.direction=-this.direction+Math.PI;
                this.x-=2;
                }
              //left
                if(this.x>arenaWidth/2-10&&this.x<arenaWidth/2&&((this.y>arenaHeight/2+10&&this.y<arenaHeight/2+50)||(this.y<arenaHeight/2-10&&this.y>arenaHeight/2-50))){
                  this.direction=-this.direction+Math.PI;
                  this.x-=2;
                  }
            //far bottom
            if(this.y>arenaHeight/2-50&&this.y<arenaHeight/2&&this.x>arenaWidth/2-10&&this.x<arenaWidth/2+10){
              this.direction=-1*this.direction;
              this.y-=2;
            }
            //bottom
            if(this.y>arenaHeight/2-10&&this.y<arenaHeight/2&&((this.x<arenaWidth/2-10&&this.x>arenaWidth/2-45)||(this.x>arenaWidth/2+10&&this.x<arenaWidth/2+45))){
              this.direction=-1*this.direction;
              this.y-=2;
            }
            //far top
            if(this.y<arenaHeight/2+50&&this.y>arenaHeight/2&&this.x>arenaWidth/2-10&&this.x<arenaWidth/2+10){
              this.direction=-1*this.direction;
              this.y+=2;
            }
            //top
            if(this.y<arenaHeight/2+10&&this.y>arenaHeight/2&&((this.x<arenaWidth/2-10&&this.x>arenaWidth/2-45)||(this.x>arenaWidth/2+10&&this.x<arenaWidth/2+45 ))){
              this.direction=-1*this.direction;
              this.y+=2;
            }
            this.x = (this.x + this.model.velocity() * Math.cos(this.direction) + arenaWidth) % arenaWidth ;
            this.y = (this.y + this.model.velocity() * Math.sin(this.direction) + arenaHeight) % arenaHeight ;}
        }
    }

    this.collide = function () {
        if (this.isDead()) { return; }
        let others = this.model.balls;
        for (let i = 0; i < id; i++) {
            if (others[i].isDead()) { continue; }
            let dx = others[i].x - this.x;
            let dy = others[i].y - this.y;
            let distance2 = dx*dx + dy*dy;
            if (distance2 < this.diameter * this.diameter) {
                let s = this.status;
                this.direction = Math.random() * 2 * Math.PI;
                others[i].direction = Math.random() * 2 * Math.PI;
                this.contactWith(others[i].status,others[i].role,others[i].source);
                others[i].contactWith(s,this.role,this.source);

            }
        }
    }

    this.display = function () {
      let diameter=this.diameter;
        if(this.isDead()){

          diameter=(-.25*Math.abs(this.deadTime-8)+3)*this.diameter;
        }
        arena.fill(this.statusColor());
        if(model.currentTime==model.maxTime-2&&this.isDead()){
          diameter=2*this.diameter;
        }

        if(this.role=="Normal"){
          arena.ellipse(this.x, this.y, diameter, diameter);
      }
        else{

          arena.rect(this.x-diameter/6, this.y-diameter/2, diameter/3, diameter);
          arena.rect(this.x-diameter/2, this.y-diameter/6, diameter, diameter/3);

        }

        }
    }



/*********** MODEL ************/

function Model() {
    this.initialize = function(socialDistance, mortality, sickTime) {
        this.socialDistance = socialDistance; /* proportion of stationary balls */
        this.sickTime = sickTime; /* how long a ball is animation frames */
        this.maxTime = graphWidth; /* maximum time of simulation */
        this.mortality = mortality; /* how likely an infected ball dies */
        this.population = 500; /* initial population */
        this.doctorPopulation=15;
        /* statistics */
        this.currentTime = 0;
        this.completionTime = 0;
        this.healthyStat = [this.population-1];
        this.immuneStat = [0];
        this.sickStat = [1];
        this.deadPatientStat = [0];
        this.deadDoctorStat=[0];
        this.communitySourceStat=[1];
        this.doctorSourceStat=[0];
        /* initialize the balls */
        this.balls = [];
        for (let i = 0; i < this.population; i++) {
            let x=Math.random() * arenaWidth;
            let y=Math.random() * arenaHeight;
            let direction=Math.random() * 2 * Math.PI;
            if(i==0){
              let inInner=(((x>arenaWidth/2-65&&x<arenaWidth/2+65)&&(y>arenaHeight/2-20&&y<arenaHeight/2+20))||((x>arenaWidth/2-20&&x<arenaWidth/2+20)&&(y>arenaHeight/2-70&&y<arenaHeight/2+70)));
              let inOuter=(((x>arenaWidth/2-0&&x<arenaWidth/2+40)&&(y>arenaHeight/2-0&&y<arenaHeight/2+40)));
              while(!inOuter||inInner){
                x=Math.random() * arenaWidth;
                y=Math.random() * arenaWidth;
                inInner=(((x>arenaWidth/2-65&&x<arenaWidth/2+65)&&(y>arenaHeight/2-20&&y<arenaHeight/2+20))||((x>arenaWidth/2-20&&x<arenaWidth/2+20)&&(y>arenaHeight/2-70&&y<arenaHeight/2+70)));
                inOuter=(((x>arenaWidth/2-0&&x<arenaWidth/2+40)&&(y>arenaHeight/2-0&&y<arenaHeight/2+40)));
              }
                let dx=arenaWidth/2-x;
                let dy=arenaHeight/2-y;
                let baseangle=Math.atan(dy/dx);
                if(dx<0){direction=baseangle+Math.PI;}
                else{direction=baseangle;}

            }
            else if(i==1){
              let inInner=(((x>arenaWidth/2-65&&x<arenaWidth/2+65)&&(y>arenaHeight/2-20&&y<arenaHeight/2+20))||((x>arenaWidth/2-20&&x<arenaWidth/2+20)&&(y>arenaHeight/2-70&&y<arenaHeight/2+70)));
              let inOuter=(((x>arenaWidth/2-0&&x<arenaWidth/2+40)&&(y>arenaHeight/2-40&&y<arenaHeight/2+0)));
              while(!inOuter||inInner){
                x=Math.random() * arenaWidth;
                y=Math.random() * arenaWidth;
                inInner=(((x>arenaWidth/2-65&&x<arenaWidth/2+65)&&(y>arenaHeight/2-20&&y<arenaHeight/2+20))||((x>arenaWidth/2-20&&x<arenaWidth/2+20)&&(y>arenaHeight/2-70&&y<arenaHeight/2+70)));
                inOuter=(((x>arenaWidth/2-0&&x<arenaWidth/2+40)&&(y>arenaHeight/2-40&&y<arenaHeight/2+0)));
                }
                let dx=arenaWidth/2-x;
                let dy=arenaHeight/2-y;
                let baseangle=Math.atan(dy/dx);
                if(dx<0){direction=baseangle+Math.PI;}
                else{direction=baseangle;}

            }
            else if(i==2){
              let inInner=(((x>arenaWidth/2-65&&x<arenaWidth/2+65)&&(y>arenaHeight/2-20&&y<arenaHeight/2+20))||((x>arenaWidth/2-20&&x<arenaWidth/2+20)&&(y>arenaHeight/2-70&&y<arenaHeight/2+70)));
              let inOuter=(((x>arenaWidth/2-40&&x<arenaWidth/2+0)&&(y>arenaHeight/2-0&&y<arenaHeight/2+40)));
              while(!inOuter||inInner){
                x=Math.random() * arenaWidth;
                y=Math.random() * arenaWidth;
                inInner=(((x>arenaWidth/2-65&&x<arenaWidth/2+65)&&(y>arenaHeight/2-20&&y<arenaHeight/2+20))||((x>arenaWidth/2-20&&x<arenaWidth/2+20)&&(y>arenaHeight/2-70&&y<arenaHeight/2+70)));
                inOuter=(((x>arenaWidth/2-40&&x<arenaWidth/2+0)&&(y>arenaHeight/2-0&&y<arenaHeight/2+40)));
              }
                let dx=arenaWidth/2-x;
                let dy=arenaHeight/2-y;
                let baseangle=Math.atan(dy/dx);
                if(dx<0){direction=baseangle+Math.PI;}
                else{direction=baseangle;}

            }
            else if(i==3){
              let inInner=(((x>arenaWidth/2-65&&x<arenaWidth/2+65)&&(y>arenaHeight/2-20&&y<arenaHeight/2+20))||((x>arenaWidth/2-20&&x<arenaWidth/2+20)&&(y>arenaHeight/2-70&&y<arenaHeight/2+70)));
              let inOuter=(((x>arenaWidth/2-40&&x<arenaWidth/2+0)&&(y>arenaHeight/2-40&&y<arenaHeight/2+0)));
              while(!inOuter||inInner){
                x=Math.random() * arenaWidth;
                y=Math.random() * arenaWidth;
                inInner=(((x>arenaWidth/2-65&&x<arenaWidth/2+65)&&(y>arenaHeight/2-20&&y<arenaHeight/2+20))||((x>arenaWidth/2-20&&x<arenaWidth/2+20)&&(y>arenaHeight/2-70&&y<arenaHeight/2+70)));
                inOuter=(((x>arenaWidth/2-40&&x<arenaWidth/2+0)&&(y>arenaHeight/2-40&&y<arenaHeight/2+0)));
                }
                let dx=arenaWidth/2-x;
                let dy=arenaHeight/2-y;
                let baseangle=Math.atan(dy/dx);
                if(dx<0){direction=baseangle+Math.PI;}
                else{direction=baseangle;}

            }
            else{
            while(((x>arenaWidth/2-80&&x<arenaWidth/2+80)&&(y>arenaHeight/2-35&&y<arenaHeight/2+35))||((x>arenaWidth/2-35&&x<arenaWidth/2+35)&&(y>arenaHeight/2-85&&y<arenaHeight/2+85))){
               x=Math.random() * arenaWidth;
               y=Math.random() * arenaWidth;
             }
            }
            this.balls.push(new Ball(x,y, direction, i, this, "Normal"));
        }
        for(let i=0; i<this.doctorPopulation; i++){
          let x=Math.random() * arenaWidth;
          let y=Math.random() * arenaHeight;
          while(!(((x>arenaWidth/2-75&&x<arenaWidth/2+75)&&(y>arenaHeight/2-30&&y<arenaHeight/2+30))||((x>arenaWidth/2-30&&x<arenaWidth/2+30)&&(y>arenaHeight/2-80&&y<arenaHeight/2+80)))){
             x=Math.random() * arenaWidth;
             y=Math.random() * arenaWidth;
           }
          this.balls.push(new Ball(x, y, Math.random() * 2 * Math.PI, this.population+i, this, "Doctor"));
        }
        /* Make one of them sick */
        this.balls[this.population].contactWith(this.sickTime,this.role, "doctor");
        this.balls[this.population].source="doctor";
    }

    this.refreshParameters = function () {
        this.socialDistance = 0.0;
        this.mortality = .04;
        this.sickTime = 5 * FRAME_RATE/3;
        for(let i=0; i<document.getElementsByName("quarantine").length;i++){
          document.getElementsByName("quarantine")[i].disabled = true;
          if(document.getElementsByName("quarantine")[i].checked){
            quarantine=document.getElementsByName("quarantine")[i].value;
          }
          else {
            document.getElementsByName("quarantine")[i].parentElement.classList.add("noHover");
          }
        }
        for(let i=0; i<document.getElementsByName("ppe").length;i++){
          document.getElementsByName("ppe")[i].disabled = true;
          if(document.getElementsByName("ppe")[i].checked){
            ppe=document.getElementsByName("ppe")[i].value;
          }
          else {
            document.getElementsByName("ppe")[i].parentElement.classList.add("noHover");
          }
        }
    }

    this.restart = function () {
      //Changes color and text of button
      document.getElementById("restart-button0").src = "images/Button_1.png";
      document.getElementById("RestartButtonLabel").innerHTML = "RESET";
        this.initialize(this.socialDistance, this.mortality, this.sickTime);
    }

    this.isFinished = function () {
        return (this.currentTime > 0) && (this.currentTime >= this.maxTime-1 ||(this.currentTime >= graphWidth && this.currentTime > this.completionTime));
    };

    /* The velocity of balls, depending on social distance. */
   this.velocity = function () {
       let velocity = (arenaWidth + arenaHeight) * (1 - this.socialDistance) / 200 ;
       return velocity;
   }

    /* Perform one step of simulation */
    this.step = function step() {
        if (this.isFinished()) { return; }
        /* update statistics */
        let im = 0;
        let si = 0;
        let dp = 0;
        let dd=0;
        let he = 0;
        let dt=0;
        let co=0;
        let doc=0;

        for (let b of this.balls) {
            if (b.isImmune()) {
               im++;
               si++;
             }
            else if (b.isDead()) {
              si++;
              if(b.role=="Doctor"){
                dd++
              }
              else{
                dp++
              }
            }
            else if (b.isSick()) {
               si++;
             }
            else {
              he++;
            }

            if(b.source=="community"){
              co++;
            }
            if(b.source=="doctor"){
              if(b.role=="Normal"){
              doc++;
            }
          }
        }

        this.immuneStat.push(im);
        this.sickStat.push(si);
        this.deadPatientStat.push(dp);
        this.deadDoctorStat.push(dd);
        this.healthyStat.push(he);
        this.communitySourceStat.push(co);
        this.doctorSourceStat.push(doc);
        if (si > 0) { this.completionTime++; }
        this.currentTime++;

        /* update the balls */
        for (let ball of this.balls) {
            ball.collide();
            ball.step();
        }
    }

    this.displayStats = function() {
        let x0 = 0.0 ;
        let x1 = Math.min(this.currentTime, graphWidth);
        let dx = (x1 - x0) / this.currentTime;
        let y0 = 0;
        let y1 = y0 + graphHeight;
        let dy = (y1 - y0) / this.population;

        /* numbers */
        let indentText = graphWidth / 8 ;
        //let he = Math.round(100 * this.healthyStat[this.he  althyStat.length-1]/(this.population+this.doctorPopulation)) ;
        //let im = Math.round(100 * this.immuneStat[this.immuneStat.length-1]/(this.population+this.doctorPopulation)) ;
        let si = Math.round(100 * this.sickStat[this.sickStat.length-1]/(this.population+this.doctorPopulation)) ;
        let dp = this.deadPatientStat[this.deadPatientStat.length-1];
        let dd =this.deadDoctorStat[this.deadDoctorStat.length-1];
        let co=this.communitySourceStat[this.communitySourceStat.length-1];
        let doc=this.doctorSourceStat[this.doctorSourceStat.length-1];
        //document.getElementById('healthy-stat0').innerHTML = he;
        //document.getElementById('provider-percentage').innerHTML = Math.round(doc/(doc+co)*100) + "%";
        document.getElementById('sick-stat0').innerHTML = si + "%";
        document.getElementById('patient-deaths').innerHTML = dp;
        document.getElementById('doctor-deaths').innerHTML = dd;
        //document.getElementById('current-time0').innerHTML = (this.completionTime / FRAME_RATE).toFixed(1);

        /* the bars */
        graph.background("#E7E7E7");
        graph.noStroke();
        /* healthy balls */
        graph.fill("#E7E7E7");
        graph.rect(x0, y0, x1 - x0, graphHeight);

        document.getElementById('progressBar').style.width = (100-100*this.currentTime/graphWidth) +"%";
        document.getElementById('progressBar').style.marginLeft = (100*this.currentTime/graphWidth) +"%";
        /* dead balls */
        /*graph.fill(DEAD_COLOR);
        graph.beginShape();
        graph.vertex(x1, y1);
        graph.vertex(x0, y1);
        for (let t = 0; t < this.deadStat.length; t++) {
            graph.vertex(x0 + t * dx, y1 - this.deadStat[t] * dy);
        }
        graph.endShape(graph.CLOSE);*/
        /* sick balls */
        graph.fill(SICK_COLOR);
        graph.beginShape();
        for (let t = 0; t < this.deadPatientStat.length; t++) {
            graph.vertex(x0 + t * dx, y1);
        }
        for (let t = this.sickStat.length; t >= 0; t--) {
            graph.vertex(x0 + t* dx, y1 - (this.sickStat[t] ) * dy);
        }
        graph.endShape(graph.CLOSE);
        /* immune balls */
        /*graph.fill(IMMUNE_COLOR);
        graph.beginShape();
        graph.vertex(x1, y0);
        graph.vertex(x0, y0);
        for (let t = 0; t < this.immuneStat.length; t++) {
            graph.vertex(x0 + t * dx, y0 + this.immuneStat[t] * dy);
        }
        graph.endShape(graph.CLOSE);*/
        graph.fill("#000000");
        let tickWidth=1;
        let numTicks=7;
        let interval=(graphWidth-2)/(numTicks-1);
        for(let i=0; i<numTicks;i++){
          graph.rect(interval*i,5*graphHeight/6,tickWidth,graphHeight/6)
        }

        graph.noFill();
        graph.rect(x0, y0, graphWidth, graphHeight);
    };
}

/********* MAIN SETUP **********/
let model = new Model();
model.initialize(0.5, 0.1, 150);
model.refreshParameters();

graph = new p5(
    (graph) => {
        graph.setup = () => {
            graph.createCanvas(graphWidth, graphHeight);
            graph.noLoop();
        };

        graph.draw = () => {
            model.displayStats();
        };
    },
    'ball-graph0');

arena = new p5(
    (arena) => {
        arena.setup = () => {
            arena.createCanvas(arenaWidth, arenaHeight);

            socialDistanceSlider = arena.select('#social-distance-slider0');
            mortalitySlider = arena.select('#mortality-slider0');
            sickTimeSlider = arena.select('#sick-time-slider0');
            restartButton = arena.select('#restart-button0');
            restartButton.mousePressed(() => { if(!model.isFinished())
              {model.currentTime = graphWidth + 40;
                console.log(model.completionTime);
              }
              else {
                model.restart ();
              model.refreshParameters();
              }
              });

            arena.frameRate(FRAME_RATE);
            arena.ellipseMode(arena.CENTER);

        };

        arena.draw = () => {
            if (model.isFinished()) {
              document.getElementById("restart-button0").src = "images/Button_0.png";
              document.getElementById("RestartButtonLabel").innerHTML = "START";
              for(let i=0; i<document.getElementsByName("quarantine").length;i++){
                document.getElementsByName("quarantine")[i].disabled = false;
                document.getElementsByName("quarantine")[i].parentElement.classList.remove("noHover");
              }
              for(let i=0; i<document.getElementsByName("ppe").length;i++){
                document.getElementsByName("ppe")[i].disabled = false;
                document.getElementsByName("ppe")[i].parentElement.classList.remove("noHover");
              }
            }
            else {
                //model.refreshParameters();
                arena.background("#F0F0F0");


                /* arena */
                arena.noStroke();

                arena.fill("#C0DBF2");
                //arena.rect(arenaWidth/2-75, arenaHeight/2-75, 150, 150,5,5,5,5)

                arena.rect(arenaWidth/2-30, arenaHeight/2-80, 60, 160);
                arena.rect(arenaWidth/2-75, arenaHeight/2-30, 150, 60);
                //arena.fill("#BAD7F0");
                if(quarantine=="leave"){
                  arena.strokeWeight(2);
                  arena.stroke("#2222AA");
                  arena.circle(arenaWidth/2,arenaHeight/2,25)
                }
                arena.noStroke();
                /* dead balls first */
                for (let b of model.balls) {
                    if (b.isDead()) { b.display(); }
                }
                /* live balls */
                for (let b of model.balls) {
                    if (!b.isDead()) { b.display(); }
                }
                model.step();
                graph.draw();
            }
        };

    },
    'ball-simulation0');
