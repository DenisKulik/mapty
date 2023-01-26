import Running from './Running';
import Cycling from './Cycling';

export default class UserInterface {
  body = document.querySelector('body');
  overlay = document.querySelector('.overlay');
  form = document.querySelector('.form');
  containerWorkouts = document.querySelector('.workouts');
  inputType = document.querySelector('.form__input--type');
  inputDistance = document.querySelector('.form__input--distance');
  inputDuration = document.querySelector('.form__input--duration');
  inputCadence = document.querySelector('.form__input--cadence');
  inputElevation = document.querySelector('.form__input--elevation');

  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // get user's position
    this.#getPosition();

    // get data from local storage
    this.#getLocalStorage();

    // attach event handlers
    this.form.addEventListener('submit', this.#newWorkout.bind(this));
    this.inputType.addEventListener(
      'change',
      this.#toggleElevationField.bind(this)
    );
    this.containerWorkouts.addEventListener(
      'click',
      this.#moveToPopup.bind(this)
    );
    this.body.addEventListener('click', this.#removeModalError.bind(this));
    document.addEventListener('keydown', this.#removeModalError.bind(this));
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

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handlich clicks on the map
    this.#map.on('click', this.#showForm.bind(this));

    // render markers
    this.#workouts.forEach((work) => {
      this.#renderWorkoutMarker(work);
    });
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
        return this.#showModalError();
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = Number(this.inputElevation.value);

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return this.#showModalError();
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

    // set local storage to all workouts
    this.#setLocalStorage();
  }

  #showModalError() {
    const html = `
			<div class="modal">
				<button class="close-modal">&times;</button>
				<svg
					class="modal__svg"
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
					width="6rem"
					height="6rem"
					version="1.1"
					viewBox="0 0 256 256"
					xml:space="preserve"
				>
					<defs></defs>
					<g
						style="
							stroke: none;
							stroke-width: 0;
							stroke-dasharray: none;
							stroke-linecap: butt;
							stroke-linejoin: miter;
							stroke-miterlimit: 10;
							fill: none;
							fill-rule: nonzero;
							opacity: 1;
						"
						transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
					>
						<path
							d="M 85.429 85.078 H 4.571 c -1.832 0 -3.471 -0.947 -4.387 -2.533 c -0.916 -1.586 -0.916 -3.479 0 -5.065 L 40.613 7.455 C 41.529 5.869 43.169 4.922 45 4.922 c 0 0 0 0 0 0 c 1.832 0 3.471 0.947 4.386 2.533 l 40.429 70.025 c 0.916 1.586 0.916 3.479 0.001 5.065 C 88.901 84.131 87.261 85.078 85.429 85.078 z M 45 7.922 c -0.747 0 -1.416 0.386 -1.79 1.033 L 2.782 78.979 c -0.373 0.646 -0.373 1.419 0 2.065 c 0.374 0.647 1.042 1.033 1.789 1.033 h 80.858 c 0.747 0 1.416 -0.387 1.789 -1.033 s 0.373 -1.419 0 -2.065 L 46.789 8.955 C 46.416 8.308 45.747 7.922 45 7.922 L 45 7.922 z M 45 75.325 c -4.105 0 -7.446 -3.34 -7.446 -7.445 s 3.34 -7.445 7.446 -7.445 s 7.445 3.34 7.445 7.445 S 49.106 75.325 45 75.325 z M 45 63.435 c -2.451 0 -4.446 1.994 -4.446 4.445 s 1.995 4.445 4.446 4.445 s 4.445 -1.994 4.445 -4.445 S 47.451 63.435 45 63.435 z M 45 57.146 c -3.794 0 -6.882 -3.087 -6.882 -6.882 V 34.121 c 0 -3.794 3.087 -6.882 6.882 -6.882 c 3.794 0 6.881 3.087 6.881 6.882 v 16.144 C 51.881 54.06 48.794 57.146 45 57.146 z M 45 30.239 c -2.141 0 -3.882 1.741 -3.882 3.882 v 16.144 c 0 2.141 1.741 3.882 3.882 3.882 c 2.14 0 3.881 -1.741 3.881 -3.882 V 34.121 C 48.881 31.98 47.14 30.239 45 30.239 z"
							style="
								stroke: none;
								stroke-width: 1;
								stroke-dasharray: none;
								stroke-linecap: butt;
								stroke-linejoin: miter;
								stroke-miterlimit: 10;
								fill: rgb(244, 95, 99);
								fill-rule: nonzero;
								opacity: 1;
							"
							transform=" matrix(1 0 0 1 0 0) "
							stroke-linecap="round"
						/>
					</g>
				</svg>
				<h1 class="modal__heading">Error</h1>
				<p class="modal__descr">Inputs have to be positive numbers</p>
			</div>
			`;
    this.body.insertAdjacentHTML('beforeend', html);
    this.overlay.classList.remove('hidden');
  }

  #removeModalError(e) {
    const modal = document.querySelector('.modal');

    if (!modal) return;

    if (
      e.target.classList.contains('close-modal') ||
      e.target.classList.contains('overlay') ||
      e.key === 'Escape'
    ) {
      modal.remove();
      this.overlay.classList.add('hidden');
    }
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

  #moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    // eslint-disable-next-line no-useless-return
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    // eslint-disable-next-line no-useless-return
    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      this.#renderWorkout(work);
    });
  }
}
