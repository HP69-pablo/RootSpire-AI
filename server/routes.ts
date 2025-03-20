import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPlantConfigSchema, insertNotificationSettingsSchema, insertSensorDataSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Plant configuration routes
  app.get('/api/plant-config/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const config = await storage.getPlantConfig(userId);
      
      if (!config) {
        return res.status(404).json({ message: 'Plant configuration not found' });
      }
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get plant configuration' });
    }
  });
  
  app.post('/api/plant-config', async (req, res) => {
    try {
      const validatedData = insertPlantConfigSchema.parse(req.body);
      const config = await storage.createPlantConfig(validatedData);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid plant configuration data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create plant configuration' });
    }
  });
  
  app.patch('/api/plant-config/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPlantConfigSchema.partial().parse(req.body);
      const config = await storage.updatePlantConfig(id, validatedData);
      
      if (!config) {
        return res.status(404).json({ message: 'Plant configuration not found' });
      }
      
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid plant configuration data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update plant configuration' });
    }
  });
  
  // Notification settings routes
  app.get('/api/notification-settings/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getNotificationSettings(userId);
      
      if (!settings) {
        return res.status(404).json({ message: 'Notification settings not found' });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get notification settings' });
    }
  });
  
  app.post('/api/notification-settings', async (req, res) => {
    try {
      const validatedData = insertNotificationSettingsSchema.parse(req.body);
      const settings = await storage.createNotificationSettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid notification settings data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create notification settings' });
    }
  });
  
  app.patch('/api/notification-settings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertNotificationSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateNotificationSettings(id, validatedData);
      
      if (!settings) {
        return res.status(404).json({ message: 'Notification settings not found' });
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid notification settings data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update notification settings' });
    }
  });
  
  // Sensor data routes
  app.get('/api/sensor-data', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const data = await storage.getSensorData(limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get sensor data' });
    }
  });
  
  app.post('/api/sensor-data', async (req, res) => {
    try {
      const validatedData = insertSensorDataSchema.parse(req.body);
      const data = await storage.createSensorData(validatedData);
      res.status(201).json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid sensor data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create sensor data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
