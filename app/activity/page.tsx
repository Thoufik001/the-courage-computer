import type {Metadata} from 'next';
import {isAdmin} from '@/lib/activity-auth';
import ActivityDashboard from '@/components/activity/ActivityDashboard';
export const metadata:Metadata={title:'Activity · Courage Computer',robots:{index:false,follow:false},openGraph:{images:[]},twitter:{images:[]}};
export default async function Activity(){return <ActivityDashboard authenticated={await isAdmin()}/>;}
