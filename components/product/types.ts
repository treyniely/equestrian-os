import type { Customer } from '../../domain/programs';
export type Resource = {
    id: string;
    kind: string;
    name: string;
    details: {
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
        description?:string;photoId?:string;dailyLimitMinutes?:number|null;restMinutes?:number;preferredHorses?:string[];preferredTrainer?:string;
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
};
export type State = {
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
