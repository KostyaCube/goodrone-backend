import { IsString, IsArray, IsOptional, MinLength, MaxLength, ArrayMaxSize } from 'class-validator';;
import { PartialType } from '@nestjs/mapped-types';
import { Prisma } from '@prisma/client';

export class CreatePostDto {
    @IsString()
    @MaxLength(500)
    @MinLength(10)
    title: string;

    @IsString()
    @MinLength(500)
    @MaxLength(5000)
    body: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(10)
    @IsString({ each: true })
    @MaxLength(30, { each: true })
    keywords?: string[];

    @IsString()
    @MaxLength(5)
    @MinLength(2)
    lang: string;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsString()
    @MaxLength(500)
    @MinLength(10)
    title?: string;

    @IsString()
    @MinLength(500)
    @MaxLength(5000)
    body?: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(10)
    @IsString({ each: true })
    @MaxLength(30, { each: true })
    keywords?: string[];

    @IsString()
    @MaxLength(5)
    @MinLength(2)
    lang?: string;
}


export class GetPostsQueryDto {
    @IsString()
    @IsOptional()
    lang: string;

    @IsOptional()
    @IsString()
    skip?: number;

    @IsOptional()
    @IsString()
    order?: keyof Prisma.PostOrderByWithRelationInput;

    @IsOptional()
    @IsString()
    userID?: string;

    @IsOptional()
    @IsString()
    saved?: string;
}