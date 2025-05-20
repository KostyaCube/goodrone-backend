import { IsString, IsNumber, IsOptional, MinLength, MaxLength } from 'class-validator';;

export class AddCommentDto {
    @IsString()
    @MaxLength(100)
    @MinLength(10)
    body: string;

    @IsNumber()
    postId: number;

    @IsOptional()
    @IsNumber()
    replyOn?: number;
}

export class EditCommentDto {
    @IsString()
    @MaxLength(100)
    @MinLength(10)
    body?: string;
}