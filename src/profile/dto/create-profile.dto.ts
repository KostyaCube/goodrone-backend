import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateProfileDto {
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

    userId: number;
}
