import { IsString, IsArray, IsOptional, MinLength, MaxLength } from 'class-validator';;
import { PartialType } from '@nestjs/mapped-types';
import { Prisma } from '@prisma/client';

export class CreatePostDto {
    @IsString()
    @MaxLength(50)
    @MinLength(10)
    title: string;

    @IsString()
    @MinLength(500)
    @MaxLength(5000)
    body: string;

    @IsArray()
    @IsOptional()
    @MaxLength(10, { each: true })
    keywords?: string[];

    @IsString()
    @MaxLength(5)
    @MinLength(2)
    lang: string;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsString()
    @MaxLength(50)
    @MinLength(10)
    title?: string;

    @IsString()
    @MinLength(500)
    @MaxLength(5000)
    body?: string;

    @IsArray()
    @IsOptional()
    @MaxLength(10, { each: true })
    keywords?: string[];

    @IsString()
    @MaxLength(5)
    @MinLength(2)
    lang?: string;
}


export class GetPostsQueryDto {
    lang: string;
    skip?: number;
    order?: keyof Prisma.PostOrderByWithRelationInput;
    userID?: string;
    saved?: string;
}