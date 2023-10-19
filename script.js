'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//We will use OOPs in this project. Data being the most fundamental part will be stored in classes and objects. The parent class Workout will store id, dist, dura, coords, date
//the child class Running and Cycling will inherit from parent and also hold data like name, cadence/elev , speed. child classes preserve the properties and methods specific to that class or activity while inheriting the common methods and properties from parent
//events inlcude Load page->Receive position(from geolocation API)->Click on map->change input->submit form. we will create different functions that will handle these events which come under a big class "App" as methods.
//loading the page will trigger the contructor() of the object that we will create using App class.Then we will get current position using the API and getPositon function, then we want to load the map based on that position. then we want a method called showForm()
//as we change the input while filling the form, we want to toggle between elev and cadence accordingly.Then the method to submit the form is executed. it is the heart of the class as this will create new Running object or Cycling Object based ond ata obtained from input data of those form.
//as the user keeps adding new workouts running or cycling, a new object will be created for each time and these objects will be stored in an array called "workouts"
//we create one class for UI and one class for business logic(logic that works only with the underlying data )
//we will also protect these data by encapsulation

class Workout {
  date = new Date(); //this is the part of modern js which hasnot been official yet so we had to define it within comment
  id = (Date.now() + '').slice(-10); //convert Date to string and remove the last 10 numbers. date.now() simply gives the current timestamps
  clicks = 0;

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; //[lat,lng]
    this.distance = distance; //in km
    this.duration = duration; // in mins
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} 
    on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1,cycling1);

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent; //Both are private Instance properties
  #workouts = [];


  constructor() {
    //get user's position
    this._getPosition(); //currentobj._getposition()

    //get data from local storage
    this._getLocalStorage();

    //Attach event listener
    form.addEventListener('submit', this._newWorkout.bind(this)); //here this keyword will point to the DOM element to which it is attached i.e. FORM element rather than "app" object. we can fix that using "  bind"
    //newworkout is a callback function for addeventlistener method
    // console.log(firstName); //firstName is a global var in others.js. so any var that is global in any script will be available to all the other scripts while as long as they appear after that script here included in html ex:  we can call the global var from other.js  into script.js because in HTML, script.js is present after other.js.
    //to get the feature of geting a pop-up after clicking on any place on map, we can't apply event listener on whole doc because it won't be able to detect the exact position where the click originated
    //to know the GPS coordinates of the clicked location, we can use a method available in leaflet library similar to addeventlistener

    //for the dropdown feature asking for type of workout like running or walking.
    //for that we will toggle
    inputType.addEventListener('change', this._toggleElevationField); //since toggleelev function doesn't mention THIS keyword anywhere within its function so we won't get the error and won't have to manually bind this.
    //event listener being added to the parent element so that the map moves to that location where the clicked activity is present
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    //Geolocation is a modern browser API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        //THIS FUNCTION TAKES two callback functions, first one on SUCCESS and second one on ERROR
        this._loadMap.bind(this), //since we are inside a class, we have to use THIS keyword.But _loadMap() is treated as a regular function call not as a method call so, since this is a call back function, we are not calling it ourselves, it is the .getcurrentposition() that will call this callback function once it gets the current position of the user. when it does call the method, it calls as a regular function call (where this is set to undefined).the solution to this is manually bind "this" keyword to wherever we need
        function () {
          alert("couldn't get your position");
        }
      );
      //Leaflet: an open-source JavaScript library for mobile-friendly interactive maps
      //we will try to implement the hosted version of leaflet that has been already hosted by somebody else on CDN
    }
  }

  _loadMap(position) {
    //geolocation runs on https server or live server, so instead of running html file, install LIVE SERVER extension on vs code and switch on . the option is mostly present at right bottom (GO LIVE)
    const { latitude } = position.coords; //coords is a child object of postion
    const { longitude } = position.coords; //to create a var longitude based out of the longitude property of coords of position
      
    //array of coords
    const coords = [latitude, longitude];
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

  
    console.log(coords);

    //console.log(this);// this is undefined here because _loadMap method is called by .getCurrentPosition()
    //the number given below as param in setView() = 13 : is the zoom level on the map
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); //whatever string is passed into the map function must be the id name of an element in our html. n it is in that element where the map will be displayed
    //L in L.map() is the main func that leaflet gives us as an entry point. a lil bit like "namespace"
    //L has a couple of methods we can use map(), tilelayer() to define the tiles of our map, marker() to display markers
    //L is ofcourse global var inside of the script of leaflet that we can access from all the other scripts
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this)); //the same ERROR, the event handler functio showform is attached to this.map i.e. map itself rather than the object.

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    //since this event handler doesn't need coords , just the form, so mapevent is not required here. but mapevent is required while submitting the form event handler which needs global declaration of mapEvent
    this.#mapEvent = mapE; //copying it to global var
    form.classList.remove('hidden');
    inputDistance.focus(); //when user clicks on any location on map, after the form appears, the distance input is focused upon with blinking cursor
  }

  _hideForm() {
    //empty inputs

    //add the new object to the workout array

    //console.log(this); //ERROR:Cannot write private member #mapEvent to an object whose class did not declare it
    //clear input field after entering the data for previous activity
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }


  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden'); //closest (acts like an inverse query selector )selects the closest parent(not children) div tag of the element mentioned as param
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden'); //by toggling both of them, we are making sure that there's always one of them that is hidden
  }

  _newWorkout(e) {
    //this function will take a array of inputs in loop and check if each input is valid or not
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); //rest params i.e. "..." gives an array. every is a method which takes all element serially from array of inputs, after checking, if all inputs are valid only then it will return true

    //to check of the input is a positive number
    const allPositive = (...inputs) => inputs.every(inp => inp > 0); //rest params i.e. "..." gives an array. every is a method which takes all element serially from array of inputs, after checking, if all inputs are valid only then it will return true
    e.preventDefault(); //without this method, after pressing Enterkey but then the site will reload which is the default behaviour of forms

    //get data from the form
    const type = inputType.value; //inputType is a select element but still we get the value using the value proprty
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout; //defined here so that it can be accessed by both running n cyc;ing if statement

    //if the workout is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) 
        return alert('Inputs have to be a positive number!');
      

      workout = new Running([lat, lng], distance, duration, cadence);
   
    }

    //if Cycling, then create cycling obj
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be a positive number!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
      
    }

    //add new obj to workout array
    this.#workouts.push(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout); //no need to bind manually as it is attached to this keyword and also not a callback function

    //render workout in the list
    this._renderWorkout(workout);

    //hide the form + clear the input fields
    this._hideForm();

    //set local storage to all workouts

    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    //display marker
    L.marker(workout.coords)
      .addTo(this.#map)
      //L.marker - creates the marker, addTo - adds the marker to the map
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`, //to change colour of the marker
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
    // //bindpopup- create popup and binds it to the marker. we are passing popup obj
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
     `;

    if (workout.type === 'running') {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
    </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;


    const workoutEl = e.target.closest('.workout');
    
    console.log(workoutEl); //id obtained here will be to access the workout array
    
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    //using the public interface
    //workout.click();//(counts the click number-now removed)objects that are coming out of local storage will not inherit all the methods of class running and cycling unlike before. so workout.click() will show error due to its non-existence.
  }

  //setlocalstorage function doesnot need any param because it gets the workouts from the workout property
  //local storage API is being used here that browser provides for us for storing small amount of data
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); //second argument has to be a string
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;

    //else restore the workout array
    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  
  reset() {
    //to empty the workouts array on reload. type workouts.reset() in terminal
    localStorage.removeItem('workouts');
    location.reload();
  }
}

//the above class App can't be accessed until an obj of that class is created
const app = new App(); //constructor is immediately called when the new obj is created

