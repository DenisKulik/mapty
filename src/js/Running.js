import Workout from './Workout';

export default class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this.caclPace();
  }

  caclPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
