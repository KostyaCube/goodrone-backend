import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateProfileDto {
    @IsNumber()
    userId: number;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsDateString()
    birthdate?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsString()
    phone?: string;
}
