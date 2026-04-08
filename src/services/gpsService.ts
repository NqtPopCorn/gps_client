export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface LocationChangeCallback {
  (location: UserLocation): void;
}

export interface GPSServiceConfig {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

class GPSService {
  private watchId: number | null = null;
  private currentLocation: UserLocation | null = null;
  private listeners: LocationChangeCallback[] = [];
  private config: Required<GPSServiceConfig>;

  constructor(config: GPSServiceConfig = {}) {
    this.config = {
      enableHighAccuracy: config.enableHighAccuracy ?? true,
      timeout: config.timeout ?? 30000,
      maximumAge: config.maximumAge ?? 0,
    };
  }

  /**
   * Get current user location once
   */
  async getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation API not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          reject(new Error(`GPS Error: ${error.message}`));
        },
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
        },
      );
    });
  }

  /**
   * Watch user location in real-time
   */
  watchLocation(callback: LocationChangeCallback): void {
    if (!navigator.geolocation) {
      throw new Error("Geolocation API not supported");
    }

    this.listeners.push(callback);

    if (this.watchId === null) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };
          this.currentLocation = location;
          this.notifyListeners(location);
        },
        (error) => {
          console.error(`GPS Watch Error: ${error.message}`);
        },
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
        },
      );
    }
  }

  /**
   * Stop watching location
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.listeners = [];
    }
  }

  /**
   * Remove specific listener
   */
  removeListener(callback: LocationChangeCallback): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
    if (this.listeners.length === 0) {
      this.stopWatching();
    }
  }

  /**
   * Calculate distance between two coordinates in meters
   * Uses Haversine formula
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if user is within POI radius
   */
  isUserInPOIRadius(
    userLat: number,
    userLon: number,
    poiLat: number,
    poiLon: number,
    poiRadius: number,
  ): boolean {
    const distance = this.calculateDistance(userLat, userLon, poiLat, poiLon);
    return distance <= poiRadius;
  }

  /**
   * Get distance from user to a point in meters
   */
  getDistanceToPOI(
    userLat: number,
    userLon: number,
    poiLat: number,
    poiLon: number,
  ): number {
    return this.calculateDistance(userLat, userLon, poiLat, poiLon);
  }

  /**
   * Get current location
   */
  getLastLocation(): UserLocation | null {
    return this.currentLocation;
  }

  /**
   * Notify all listeners of location change
   */
  private notifyListeners(location: UserLocation): void {
    this.listeners.forEach((listener) => listener(location));
  }

  /**
   * Check if currently watching location
   */
  isWatching(): boolean {
    return this.watchId !== null;
  }
}

// Export singleton instance
export const gpsService = new GPSService();

// Export class for custom instances if needed
export default GPSService;
