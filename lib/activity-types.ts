export type ActivityEvent={at:number;type:string;target?:string;x?:number;y?:number};
export type ActivityChat={id:string;at:number;input:string;output:string;inputWords:number;outputWords:number;firstTextMs:number|null;responseMs:number;status:number};
export type ActivitySession={id:string;startedAt:number;updatedAt:number;sequence:number;browser:string;os:string;device:string;language:string;viewport:string;referrer:string;visits:number;clicks:number;questions:number;inputWords:number;outputWords:number;activeMs:number;durationMs:number;events:ActivityEvent[];chats:ActivityChat[]};
export const retentionDays=365;
