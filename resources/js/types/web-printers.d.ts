 

// Minimal ambient type declarations for the Web Bluetooth API.
// The full spec lives in the @types/web-bluetooth package; this subset
// covers only the surface area we use (pairing + GATT write).

interface BluetoothRequestDeviceFilter {
    services?: ReadonlyArray<string | number>;
    name?: string;
    namePrefix?: string;
}

interface RequestDeviceOptions {
    filters?: ReadonlyArray<BluetoothRequestDeviceFilter>;
    optionalServices?: ReadonlyArray<string | number>;
    acceptAllDevices?: boolean;
}

interface BluetoothLEScanFilter {
    services?: ReadonlyArray<string | number>;
    name?: string;
    namePrefix?: string;
}

interface RequestLEScanOptions {
    filters: ReadonlyArray<BluetoothLEScanFilter>;
    keepRepeatedDevices?: boolean;
    acceptAllAdvertisements?: boolean;
}

interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    getDevices(): Promise<BluetoothDevice[]>;
    requestLEScan?(options: RequestLEScanOptions): Promise<BluetoothLEScan>;
}

interface BluetoothCharacteristicProperties {
    broadcast?: boolean;
    read?: boolean;
    writeWithoutResponse?: boolean;
    write?: boolean;
    notify?: boolean;
    indicate?: boolean;
    authenticatedSignedWrites?: boolean;
    reliableWrite?: boolean;
    writableAuxiliaries?: boolean;
}

interface BluetoothCharacteristic extends EventTarget {
    uuid: string;
    properties: BluetoothCharacteristicProperties;
    value?: DataView;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothCharacteristic>;
    stopNotifications(): Promise<BluetoothCharacteristic>;
}

interface BluetoothService {
    uuid: string;
    isPrimary: boolean;
    getCharacteristic(characteristic: string | number): Promise<BluetoothCharacteristic>;
    getCharacteristics(): Promise<BluetoothCharacteristic[]>;
}

interface BluetoothServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothServer>;
    disconnect(): void;
    getPrimaryService(service: string | number): Promise<BluetoothService>;
    getPrimaryServices(): Promise<BluetoothService[]>;
}

interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothServer;
}

interface BluetoothLEScan {
    stop(): void;
}

interface Navigator {
    bluetooth: Bluetooth;
}

// Minimal ambient type declarations for the WebUSB API.

interface USBDevice {
    vendorId: number;
    productId: number;
    productName?: string;
    manufacturerName?: string;
    serialNumber?: string;
    configuration?: USBConfiguration | null;
    configurations: ReadonlyArray<USBConfiguration>;
    opened: boolean;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
    reset(): Promise<void>;
    transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
    isConfigurationSupported(configurationValue: number): Promise<boolean>;
}

interface USBConfiguration {
    configurationValue: number;
    configurationName?: string;
    interfaces: ReadonlyArray<USBInterface>;
}

interface USBInterface {
    interfaceNumber: number;
    alternate: USBAlternateInterface;
    alternates: ReadonlyArray<USBAlternateInterface>;
    claimed: boolean;
}

interface USBAlternateInterface {
    alternateSetting: number;
    interfaceClass: number;
    interfaceSubclass: number;
    interfaceProtocol: number;
    interfaceName?: string;
    endpoints: ReadonlyArray<USBEndpoint>;
}

interface USBEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
    type: 'bulk' | 'interrupt' | 'isochronous';
    packetSize: number;
}

interface USBInTransferResult {
    data?: DataView;
    status: 'ok' | 'stall' | 'babble' | 'babble2';
}

interface USBOutTransferResult {
    bytesWritten: number;
    status: 'ok' | 'stall';
}

interface USBDeviceRequestOptions {
    filters: ReadonlyArray<{ vendorId?: number; productId?: number; classCode?: number; subclassCode?: number; protocolCode?: number; serialNumber?: string }>;
}

interface USB {
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
    getDevices(): Promise<USBDevice[]>;
}

interface Navigator {
    usb: USB;
}