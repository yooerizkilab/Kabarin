import { create } from 'zustand';

interface Device {
    id: string;
    name: string;
    phoneNumber: string | null;
    status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'QR_REQUIRED';
    createdAt: string;
}

interface DeviceStore {
    devices: Device[];
    qrCodes: Record<string, string>; // deviceId -> qr string
    setDevices: (devices: Device[]) => void;
    updateDeviceStatus: (deviceId: string, status: Device['status'], phoneNumber?: string) => void;
    setQrCode: (deviceId: string, qr: string) => void;
    clearQrCode: (deviceId: string) => void;
    addDevice: (device: Device) => void;
    removeDevice: (deviceId: string) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
    devices: [],
    qrCodes: {},

    setDevices: (devices) => set({ devices }),

    updateDeviceStatus: (deviceId, status, phoneNumber) =>
        set((state) => ({
            devices: state.devices.map((d) =>
                d.id === deviceId
                    ? { ...d, status, ...(phoneNumber !== undefined && { phoneNumber }) }
                    : d
            ),
        })),

    setQrCode: (deviceId, qr) =>
        set((state) => ({ qrCodes: { ...state.qrCodes, [deviceId]: qr } })),

    clearQrCode: (deviceId) =>
        set((state) => {
            const { [deviceId]: _, ...rest } = state.qrCodes;
            return { qrCodes: rest };
        }),

    addDevice: (device) =>
        set((state) => ({ devices: [device, ...state.devices] })),

    removeDevice: (deviceId) =>
        set((state) => ({ devices: state.devices.filter((d) => d.id !== deviceId) })),
}));
