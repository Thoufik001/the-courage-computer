export const activityTime=(ms:number)=>ms<60000?`${Math.round(ms/1000)}s`:ms<3600000?`${Math.round(ms/60000)}m`:`${Math.floor(ms/3600000)}h ${Math.round(ms%3600000/60000)}m`;
export const activityDate=(at:number)=>new Date(at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
