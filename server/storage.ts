import { users, User, InsertUser, plantConfigs, PlantConfig, InsertPlantConfig, notificationSettings, NotificationSettings, InsertNotificationSettings, sensorData, SensorData, InsertSensorData } from "@shared/schema";

export interface IStorage {
  // User methods (from original storage)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Plant configuration methods
  getPlantConfig(userId: number): Promise<PlantConfig | undefined>;
  createPlantConfig(config: InsertPlantConfig): Promise<PlantConfig>;
  updatePlantConfig(id: number, config: Partial<InsertPlantConfig>): Promise<PlantConfig | undefined>;
  
  // Notification settings methods
  getNotificationSettings(userId: number): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(id: number, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;
  
  // Sensor data methods
  getSensorData(limit: number): Promise<SensorData[]>;
  createSensorData(data: InsertSensorData): Promise<SensorData>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private plantConfigsMap: Map<number, PlantConfig>;
  private notificationSettingsMap: Map<number, NotificationSettings>;
  private sensorDataArray: SensorData[];
  
  private currentUserId: number;
  private currentPlantConfigId: number;
  private currentNotificationSettingsId: number;
  private currentSensorDataId: number;

  constructor() {
    this.users = new Map();
    this.plantConfigsMap = new Map();
    this.notificationSettingsMap = new Map();
    this.sensorDataArray = [];
    
    this.currentUserId = 1;
    this.currentPlantConfigId = 1;
    this.currentNotificationSettingsId = 1;
    this.currentSensorDataId = 1;
  }

  // User methods (from original storage)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Plant configuration methods
  async getPlantConfig(userId: number): Promise<PlantConfig | undefined> {
    return Array.from(this.plantConfigsMap.values()).find(
      config => config.userId === userId
    );
  }
  
  async createPlantConfig(insertConfig: InsertPlantConfig): Promise<PlantConfig> {
    const id = this.currentPlantConfigId++;
    const now = new Date();
    const config: PlantConfig = { ...insertConfig, id, createdAt: now };
    this.plantConfigsMap.set(id, config);
    return config;
  }
  
  async updatePlantConfig(id: number, updateData: Partial<InsertPlantConfig>): Promise<PlantConfig | undefined> {
    const existingConfig = this.plantConfigsMap.get(id);
    if (!existingConfig) return undefined;
    
    const updatedConfig: PlantConfig = {
      ...existingConfig,
      ...updateData
    };
    
    this.plantConfigsMap.set(id, updatedConfig);
    return updatedConfig;
  }
  
  // Notification settings methods
  async getNotificationSettings(userId: number): Promise<NotificationSettings | undefined> {
    return Array.from(this.notificationSettingsMap.values()).find(
      settings => settings.userId === userId
    );
  }
  
  async createNotificationSettings(insertSettings: InsertNotificationSettings): Promise<NotificationSettings> {
    const id = this.currentNotificationSettingsId++;
    const now = new Date();
    const settings: NotificationSettings = { ...insertSettings, id, createdAt: now };
    this.notificationSettingsMap.set(id, settings);
    return settings;
  }
  
  async updateNotificationSettings(id: number, updateData: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    const existingSettings = this.notificationSettingsMap.get(id);
    if (!existingSettings) return undefined;
    
    const updatedSettings: NotificationSettings = {
      ...existingSettings,
      ...updateData
    };
    
    this.notificationSettingsMap.set(id, updatedSettings);
    return updatedSettings;
  }
  
  // Sensor data methods
  async getSensorData(limit: number): Promise<SensorData[]> {
    return this.sensorDataArray
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  async createSensorData(insertData: InsertSensorData): Promise<SensorData> {
    const id = this.currentSensorDataId++;
    const now = new Date();
    const data: SensorData = { ...insertData, id, timestamp: now };
    this.sensorDataArray.push(data);
    return data;
  }
}

export const storage = new MemStorage();
