import { File } from "@prisma/client";

export class UserCommonInfoDto {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    avatar: File | null;
    registered: Date;
    subscriptions: any[]; /////// TODO
    subscribers: any[];
}
