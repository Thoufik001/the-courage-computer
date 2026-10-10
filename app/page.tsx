import DiaryExperience from '@/components/DiaryExperience';
import {existsSync} from 'node:fs';
import path from 'node:path';
export default function Page(){const root=path.join(process.cwd(),'public');const textures:Record<string,string>={};for(const material of ['wood','paper','leather','stone'])for(const map of ['map','normalMap','roughnessMap']){const name=`${material}-${map}`;for(const ext of ['jpg','png','webp'])if(existsSync(path.join(root,`textures/${name}.${ext}`)))textures[name]=`/textures/${name}.${ext}`;}return <DiaryExperience assets={{diary:existsSync(path.join(root,'models/diary.glb')),table:existsSync(path.join(root,'models/table.glb')),textures}}/>;}
