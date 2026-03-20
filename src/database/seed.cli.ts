import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EventSeedService } from './seeds/event.seed';

async function seedDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const eventSeeder = app.get(EventSeedService);
    await eventSeeder.seedEvents();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await app.close();
  }
}

seedDatabase();
