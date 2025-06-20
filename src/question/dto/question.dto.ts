import { PartialType } from '@nestjs/mapped-types';
import { Prisma } from '@prisma/client';
import { IsString, IsArray, IsOptional, MinLength, MaxLength, ArrayMaxSize } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    @MaxLength(50)
    @MinLength(5)
    title: string;

    @IsString()
    @MinLength(50)
    @MaxLength(500)
    body: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(10)
    @IsString({ each: true })
    @MaxLength(30, { each: true })
    keywords?: string[];
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {
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
    @ArrayMaxSize(10)
    @IsString({ each: true })
    @MaxLength(30, { each: true })
    keywords?: string[];
}

export class GetQuestionsQueryDto {
    @IsOptional()
    @IsString()
    skip?: number;

    @IsOptional()
    @IsString()
    order?: keyof Prisma.QuestionOrderByWithRelationInput;

    @IsOptional()
    @IsString()
    userID?: string;

    @IsOptional()
    keywords?: string[] | string;
}