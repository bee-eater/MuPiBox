import { Image } from '../current.image';

export interface CurrentTrack {
    duration_ms?: number;
    id?: string;
    name?: string;
    type?: string;
    album?:{
        images?: Image[];
    }
}