export type TrainerReview={id:string;trainer:string;rating:number;message:string;status:'pending'|'approved'|'hidden';revision:number;updated:number};
export type PublishedReview=Pick<TrainerReview,'id'|'trainer'|'rating'|'message'>;
export type OwnReview=TrainerReview;
