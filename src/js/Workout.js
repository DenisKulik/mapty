export default class Workout {
  date = new Date();
  id = Date.now().toString().slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}
