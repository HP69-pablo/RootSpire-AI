import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication (from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Plant configurations table
export const plantConfigs = pgTable("plant_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plantType: text("plant_type").notNull(),
  tempMin: real("temp_min").notNull(),
  tempMax: real("temp_max").notNull(),
  humidityMin: integer("humidity_min").notNull(),
  humidityMax: integer("humidity_max").notNull(),
  soilMoistureMin: integer("soil_moisture_min").notNull(),
  soilMoistureMax: integer("soil_moisture_max").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlantConfigSchema = createInsertSchema(plantConfigs).omit({
  id: true,
  createdAt: true,
});

export type InsertPlantConfig = z.infer<typeof insertPlantConfigSchema>;
export type PlantConfig = typeof plantConfigs.$inferSelect;

// Notification settings table
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  enableNotifications: boolean("enable_notifications").notNull().default(true),
  lowMoistureAlerts: boolean("low_moisture_alerts").notNull().default(true),
  temperatureAlerts: boolean("temperature_alerts").notNull().default(false),
  humidityAlerts: boolean("humidity_alerts").notNull().default(false),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
});

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

// Sensor data table for storing historical readings
export const sensorData = pgTable("sensor_data", {
  id: serial("id").primaryKey(),
  temperature: real("temperature").notNull(),
  humidity: integer("humidity").notNull(),
  soilMoisture: integer("soil_moisture").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertSensorDataSchema = createInsertSchema(sensorData).omit({
  id: true,
  timestamp: true,
});

export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;
export type SensorData = typeof sensorData.$inferSelect;
