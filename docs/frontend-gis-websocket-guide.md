# Frontend Integration Guide: Live GIS WebSocket & Real-Time Fleet Map

This document defines the **WebSocket API Contract, Data Schemas, Connection Protocol, and Frontend Code Examples** for real-time live GPS fleet tracking in the Waste Management AI Platform.

---

## 📡 1. Connection Endpoint & Protocols

- **Protocol**: WebSocket / Socket.IO (v4.x)
- **Local Dev URL**: `ws://localhost:7001` (or `http://localhost:7001` with Socket.IO transport)
- **Production URL**: `wss://api.yourdomain.com`
- **Namespace / Room**: Root `/` or `/gis`

---

## 🔒 2. Authentication & Handshake Contract

The WebSocket gateway enforces **JWT Bearer Token Authentication** on initial connection handshake.

### Client Connection Code (TypeScript / JavaScript):

```typescript
import { io, Socket } from 'socket.io-client';

const token = 'YOUR_JWT_ACCESS_TOKEN';

const socket: Socket = io('http://localhost:7001', {
  transports: ['websocket'],
  auth: {
    token: `Bearer ${token}`,
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  console.log('✅ Connected to Live GIS WebSocket Gateway with ID:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('❌ Socket Authentication Error:', err.message);
});
```

---

## 📱 3. Driver Mobile App Contract (Transmitting GPS Coordinates)

The Driver App transmits high-precision device GPS updates every 3 to 10 seconds while a shift dispatch is active.

### Event Name: `driver:location_update`

#### Payload Request Schema:

```json
{
  "dispatchId": 10,
  "vehicleId": 1,
  "latitude": 18.520412,
  "longitude": 73.856743,
  "speedKmH": 35.5,
  "heading": 180.0,
  "accuracyMeters": 4.2,
  "timestamp": "2026-08-08T03:10:00.000Z"
}
```

#### Driver App Emit Code:

```typescript
function sendGpsCoordinate(position) {
  socket.emit('driver:location_update', {
    dispatchId: activeDispatchId,
    vehicleId: assignedVehicleId,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    speedKmH: position.coords.speed ? position.coords.speed * 3.6 : 0,
    heading: position.coords.heading || 0,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 💻 4. Admin Web Portal Contract (Subscribing & Rendering Live Map)

The Admin Web Portal subscribes to live fleet updates for an organization (or all organizations for Super-Admins) and renders real-time moving markers on Google Maps / Leaflet.

### Step 1: Subscribe to Organization Fleet Room

Emit event `subscribe:fleet_map` immediately after connecting:

```typescript
// Subscribe to single Organization room
socket.emit('subscribe:fleet_map', { organizationId: 1 });

// OR Subscribe to Global Fleet Room (Super-Admins)
socket.emit('subscribe:fleet_map', { isGlobal: true });
```

### Step 2: Listen for Live Location Broadcasts

#### Event Name: `fleet:location_changed`

#### Multi-Tenant Target Organization Logic:

If a truck owned by **Organization #1** is running a shift for a site owned by **Organization #2**, the gateway dynamically broadcasts to **BOTH rooms** (`org:1:fleet` and `org:2:fleet`) simultaneously via `targetOrgIds: [1, 2]`!

#### Payload Response Schema:

```json
{
  "dispatchId": 10,
  "vehicleId": 1,
  "registrationNumber": "MH-12-AB-1234",
  "vehicleType": "COMPACTOR_TRUCK",
  "organizationId": 1,
  "targetOrgIds": [1, 2],
  "driverName": "John Doe",
  "latitude": 18.520412,
  "longitude": 73.856743,
  "speedKmH": 35.5,
  "heading": 180.0,
  "timestamp": "2026-08-08T03:10:00.000Z"
}
```

---

## 🎨 5. Complete Frontend Next.js / React Component Example

```tsx
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';

interface LiveVehicle {
  dispatchId: number;
  vehicleId: number;
  registrationNumber: string;
  driverName: string;
  latitude: number;
  longitude: number;
  heading: number;
  speedKmH: number;
}

export default function AdminLiveFleetMap() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [vehicles, setVehicles] = useState<Record<number, LiveVehicle>>({});

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const newSocket = io('http://localhost:7001', {
      auth: { token: `Bearer ${token}` },
    });

    newSocket.on('connect', () => {
      // Subscribe to organization fleet stream
      newSocket.emit('subscribe:fleet_map', { organizationId: 1 });
    });

    // Listen for real-time location stream
    newSocket.on('fleet:location_changed', (updatedVehicle: LiveVehicle) => {
      setVehicles((prev) => ({
        ...prev,
        [updatedVehicle.vehicleId]: updatedVehicle,
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  if (!isLoaded) return <div>Loading GIS Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '600px' }}
      center={{ lat: 18.5204, lng: 73.8567 }}
      zoom={13}
    >
      {Object.values(vehicles).map((truck) => (
        <MarkerF
          key={truck.vehicleId}
          position={{ lat: truck.latitude, lng: truck.longitude }}
          icon={{
            url: '/icons/truck.png',
            rotation: truck.heading,
          }}
          title={`${truck.registrationNumber} (${truck.driverName}) - ${truck.speedKmH} km/h`}
        />
      ))}
    </GoogleMap>
  );
}
```

---

## 🛠️ 6. Error Handling & Connection Lifecycle

| Event                   | Direction        | Description                                                                            |
| :---------------------- | :--------------- | :------------------------------------------------------------------------------------- |
| `connect`               | Server -> Client | Connection established successfully.                                                   |
| `connect_error`         | Server -> Client | Authentication failed or token expired.                                                |
| `disconnect`            | Server -> Client | Socket closed due to network drop or server restart. Auto-reconnect kicks in after 2s. |
| `subscribe:fleet_map`   | Client -> Server | Join organization room (or global room) for real-time map updates.                     |
| `unsubscribe:fleet_map` | Client -> Server | Leave room when user navigates away from map page.                                     |
