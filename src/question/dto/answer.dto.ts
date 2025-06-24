import { PartialType } from '@nestjs/mapped-types';
import { IsString, MinLength, MaxLength, IsNumber } from 'class-validator';

export class CreateAnswerDto {
    @IsNumber()
    questionId: number;

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