import Running from './Running';
import Cycling from './Cycling';

export default class UserInterface {
  form = document.querySelector('.form');
  containerWorkouts = document.querySelector('.workouts');
  inputType = document.querySelector('.form__input--type');
  inputDistance = document.querySelector('.form__input--distance');
  inputDuration = document.querySelector('.form__input--duration');
  inputCadence = document.querySelector('.form__input--cadence');
  inputElevation = document.querySelector('.form__input--elevation');

  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this.#getPosition();

    this.form.addEventListener('submit', this.#newWorkout.bind(this));
    this.inputType.addEventListener(
      'change',
      this.#toggleElevationField.bind(this)
    );
  }

  #getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        // eslint-disable-next-line no-alert
        () => alert('Could not get your position')
      );
    }
  }

  #loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handlich clicks on the map
    this.#map.on('click', this.#showForm.bind(this));
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;

    this.form.classList.remove('hidden');
    this.inputDistance.focus();
  }

  #hideForm() {
    this.inputDistance.value = '';
    this.inputDuration.value = '';
    this.inputCadence.value = '';
    this.inputElevation.value = '';

    this.form.style.display = 'none';
    this.form.classList.add('hidden');
    setTimeout(() => {
      this.form.style.display = 'grid';
    }, 1000);
  }

  // eslint-disable-next-line class-methods-use-this
  #toggleElevationField() {
    this.inputElevation
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
    this.inputCadence
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
  }

  // eslint-disable-next-line consistent-return
  #newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inps) => inps.every((inp) => Number.isFinite(inp));
    const allPositive = (...inps) => inps.every((inp) => inp > 0);

    // get data from form
    const type = this.inputType.value;
    const distance = Number(this.inputDistance.value);
    const duration = Number(this.inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadence = Number(this.inputCadence.value);

      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        // eslint-disable-next-line no-alert
        return alert('Inputs have to be positive numbers');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = Number(this.inputElevation.value);

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        // eslint-disable-next-line no-alert
        return alert('Inputs have to be positive numbers');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add a new object to workout array
    this.#workouts.push(workout);

    // render workout on map as marker
    this.#renderWorkoutMarker(workout);

    // render workout on list
    this.#renderWorkout(workout);

    // hide form and clear input fields
    this.#hideForm();
  }

  #renderWorkoutMarker(workout) {
    L.marker(workout.coords, { opacity: 0.6 })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    let html = `
			<li class="workout workout--${workout.type}" data-id="${workout.id}">
				<h2 class="workout__title">${workout.description}</h2>
				<div class="workout__details">
					<span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
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
      html += `
				<div class="workout__details">
					<span class="workout__icon">⚡️</span>
					<span class="workout__value">${workout.pace.toFixed(1)}</span>
					<span class="workout__unit">min/km</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">🦶🏼</span>
					<span class="workout__value">${workout.cadence}</span>
					<span class="workout__unit">spm</span>
				</div>
			</li>
			`;
    }

    if (workout.type === 'cycling') {
      html += `
				<div class="workout__details">
					<span class="workout__icon">⚡️</span>
					<span class="workout__value">${workout.speed.toFixed(1)}</span>
					<span class="workout__unit">km/h</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">⛰</span>
					<span class="workout__value">${workout.elevationGain}</span>
					<span class="workout__unit">m</span>
					</div>
			</li>
			`;
    }

    this.form.insertAdjacentHTML('afterend', html);
  }
}
