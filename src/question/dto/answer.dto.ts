import { PartialType } from '@nestjs/mapped-types';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateAnswerDto {
    @IsString()
    questionId: string;

    @IsString()
    @MinLength(10)
    @MaxLength(500)
    body: string;
}

export class UpdateAnswerDto extends PartialType(CreateAnswerDto) {
    @IsString()
    @MinLength(10)
    @MaxLength(500)
    body?: string;
}