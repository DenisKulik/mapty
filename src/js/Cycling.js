import Workout from './Workout';

export default class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.caclSpeed();
    this._setDescription();
  }

  caclSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
