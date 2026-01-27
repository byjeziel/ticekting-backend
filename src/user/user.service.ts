import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../producers/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      $or: [{ auth0Id: createUserDto.auth0Id }, { email: createUserDto.email }]
    });

    if (existingUser) {
      throw new ConflictException('User with this Auth0 ID or email already exists');
    }

    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.userModel.findOne({ auth0Id, isActive: true }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userModel.find({ role, isActive: true }).exec();
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deactivate(id: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
  }

  async createOrUpdateFromAuth0(auth0Profile: any): Promise<User> {
    const { sub, email, name } = auth0Profile;
    
    let user = await this.findByAuth0Id(sub);
    
    if (!user) {
      const createUserDto: CreateUserDto = {
        auth0Id: sub,
        email,
        name,
        role: UserRole.CLIENT, // Default role for new users
      };
      
      user = await this.create(createUserDto);
    } else {
      // Update user info if it has changed
      await this.update((user as any)._id.toString(), { email, name });
      user = await this.findByAuth0Id(sub);
    }
    
    return user!;
  }
}
