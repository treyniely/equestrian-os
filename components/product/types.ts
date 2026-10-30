import type { Customer } from '../../domain/programs';
export type Resource = {
    id: string;
    kind: string;
    name: string;
    details: {
        brandColor?:string;cancellationHours?:number;
        level?: string;
        duration?: number;
        capacity?: number;
        price?: number;
        template?: string;
        mounted?: boolean;
        access?: string;
        group?: string;
        customer?: string;
        discipline?: string;
        availability?:import('../../domain/availability').Availability;suitableLevels?:string[];description?:string;photoId?:string;dailyLimitMinutes?:number|null;restMinutes?:number;preferredHorses?:string[];preferredTrainer?:string;preferredTrainers?:string[];
    };
};
export type Session = {
    id: string;
    program: string;
    start: number;
    end: number;
    capacity: number;
    status: string;
};
export type Membership = {
    id: string;
    customer: string;
    plan: string;
    status: string;
    updated: number;
};
export type Draft = {
    id: string;
    kind: string;
    name: string;
    segment: string;
    channel: string;
    message: string;
    delay: number;
    created: number;
    audience?:string;
};
export type State = {
    academyInfo?:{name:string;timezone:string};
    intern_attendance?:{intern:string;date:string;status:string}[];barn_tasks?:{id:string;date:string;title:string;intern:string|null;session:string|null;due:number;status:string;updated:number;generated_key?:string;sessionCanceled?:boolean}[];
    customer_groups?:{customer:string;group_id:string}[];
    team?:{id:string;name:string;email:string;role:string;permissions:string;status:string}[];permissions?:import('../../domain/permissions').Grants;currentRole?:string;inviteUrl?:string;
    resources: Resource[];
    bookings: any[];
    customers: Customer[];
    memberships: Membership[];
    sessions: Session[];
    enrollments: {
        id: string;
        session: string;
        rider: string;
    }[];
    reservations: {
        session: string;
        resource: string;
        kind: string;
    }[];
    drafts: Draft[];
    audit: {
        action: string;
        created: number;
    }[];
};
export type Save = (data: Record<string, unknown>) => Promise<boolean>;
